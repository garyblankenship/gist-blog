package github

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"gist/internal/domain"
)

// Client implements the GistRepository interface for GitHub API
type Client struct {
	httpClient *http.Client
	baseURL    string
	token      string
	username   string
	rateLimit  rateLimitState
	retryMax   int
	retryWait  time.Duration
}

type rateLimitState struct {
	remaining int
	reset     time.Time
}

// NewClient creates a new GitHub API client
func NewClient(token, username string) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		baseURL:    "https://api.github.com",
		token:      token,
		username:   username,
		retryMax:   3,
		retryWait:  100 * time.Millisecond,
	}
}

// parseRateLimit extracts rate limit information from response headers
func (c *Client) parseRateLimit(resp *http.Response) {
	if remaining := resp.Header.Get("X-RateLimit-Remaining"); remaining != "" {
		c.rateLimit.remaining, _ = strconv.Atoi(remaining)
	}
	if reset := resp.Header.Get("X-RateLimit-Reset"); reset != "" {
		unix, _ := strconv.ParseInt(reset, 10, 64)
		c.rateLimit.reset = time.Unix(unix, 0)
	}
}

// maxRateLimitWait caps how long a throttled request will block, so a skewed
// server clock cannot stall the CLI for the full rate-limit window.
const maxRateLimitWait = time.Minute

// rateLimitWait decides how long to wait before retrying a throttled request.
// Prefers the Retry-After header (delta-seconds or HTTP-date), then the
// rate-limit reset time, capped at maxRateLimitWait. Returns 0 if no wait is
// needed.
func (c *Client) rateLimitWait(resp *http.Response) time.Duration {
	if ra := resp.Header.Get("Retry-After"); ra != "" {
		if secs, err := strconv.Atoi(ra); err == nil {
			return min(time.Duration(secs)*time.Second, maxRateLimitWait)
		}
		if t, err := http.ParseTime(ra); err == nil {
			return min(time.Until(t), maxRateLimitWait)
		}
	}
	wait := time.Until(c.rateLimit.reset)
	if wait < 0 {
		return 0
	}
	return min(wait, maxRateLimitWait)
}

// apiRequest makes an authenticated request to the GitHub API with rate limiting and retry logic
func (c *Client) apiRequest(ctx context.Context, method, url string, body []byte) (*http.Response, error) {
	var lastErr error
	for attempt := 0; attempt <= c.retryMax; attempt++ {
		var reader io.Reader
		if body != nil {
			reader = bytes.NewReader(body)
		}
		req, err := http.NewRequestWithContext(ctx, method, url, reader)
		if err != nil {
			return nil, fmt.Errorf("create request: %w", err)
		}

		req.Header.Set("Authorization", "Bearer "+c.token)
		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("User-Agent", "Gist-CLI")
		if body != nil {
			req.Header.Set("Content-Type", "application/json")
		}

		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, err
		}

		c.parseRateLimit(resp)

		// Rate limited: GitHub throttles with 429, or 403 once the budget is
		// exhausted. Honor Retry-After when present, capped to avoid stalling.
		if resp.StatusCode == http.StatusTooManyRequests ||
			(resp.StatusCode == http.StatusForbidden && c.rateLimit.remaining == 0) {
			resp.Body.Close()
			wait := c.rateLimitWait(resp)
			if wait > 0 {
				select {
				case <-time.After(wait):
				case <-ctx.Done():
					return nil, ctx.Err()
				}
			}
			continue
		}

		if resp.StatusCode < 500 {
			return resp, nil
		}

		// Server error. Read the error body BEFORE closing so the message is
		// not blank, then only retry idempotent GETs — retrying POST/PATCH/
		// DELETE can duplicate a gist created just before the 5xx.
		lastErr = c.handleAPIError(resp)
		resp.Body.Close()
		if method != http.MethodGet {
			return nil, lastErr
		}

		wait := time.Duration(1<<uint(attempt)) * c.retryWait
		select {
		case <-time.After(wait):
		case <-ctx.Done():
			return nil, ctx.Err()
		}
	}

	if lastErr == nil {
		return nil, fmt.Errorf("apiRequest: retries exhausted for %s %s", method, url)
	}
	return nil, lastErr
}

// GetAll retrieves all gists for the authenticated user (both public and private)
func (c *Client) GetAll(ctx context.Context) ([]domain.Gist, error) {
	// Use authenticated endpoint to get both public and private gists
	url := fmt.Sprintf("%s/gists", c.baseURL)

	resp, err := c.apiRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.handleAPIError(resp)
	}

	var gists []domain.Gist
	if err := json.NewDecoder(resp.Body).Decode(&gists); err != nil {
		return nil, fmt.Errorf("decode gists response: %w", err)
	}

	return gists, nil
}

// GetByID retrieves a specific gist by ID
func (c *Client) GetByID(ctx context.Context, id domain.GistID) (*domain.Gist, error) {
	url := fmt.Sprintf("%s/gists/%s", c.baseURL, id.String())

	resp, err := c.apiRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, domain.ErrGistNotFound{ID: id}
	}

	if resp.StatusCode != http.StatusOK {
		return nil, c.handleAPIError(resp)
	}

	var gist domain.Gist
	if err := json.NewDecoder(resp.Body).Decode(&gist); err != nil {
		return nil, fmt.Errorf("decode gist response: %w", err)
	}

	return &gist, nil
}

// Create creates a new gist
func (c *Client) Create(ctx context.Context, gist *domain.Gist) error {
	// Convert domain.Gist to GitHub API format
	payload := map[string]interface{}{
		"description": gist.Description,
		"public":      gist.Public,
		"files":       c.formatFiles(gist.Files),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal gist: %w", err)
	}

	url := fmt.Sprintf("%s/gists", c.baseURL)
	resp, err := c.apiRequest(ctx, "POST", url, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return c.handleAPIError(resp)
	}

	// Parse response to get the created gist ID
	var created domain.Gist
	if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
		return fmt.Errorf("decode created gist: %w", err)
	}

	// Update the original gist with the ID from GitHub
	gist.ID = created.ID
	gist.HTMLURL = created.HTMLURL
	gist.CreatedAt = created.CreatedAt
	gist.UpdatedAt = created.UpdatedAt

	return nil
}

// Update updates an existing gist
func (c *Client) Update(ctx context.Context, gist *domain.Gist) error {
	payload := map[string]interface{}{
		"description": gist.Description,
		"files":       c.formatFiles(gist.Files),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal gist update: %w", err)
	}

	url := fmt.Sprintf("%s/gists/%s", c.baseURL, gist.ID.String())
	resp, err := c.apiRequest(ctx, "PATCH", url, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return c.handleAPIError(resp)
	}

	return nil
}

// Delete removes a gist
func (c *Client) Delete(ctx context.Context, id domain.GistID) error {
	url := fmt.Sprintf("%s/gists/%s", c.baseURL, id.String())

	resp, err := c.apiRequest(ctx, "DELETE", url, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return c.handleAPIError(resp)
	}

	return nil
}

// maxAPIErrorBodyBytes caps how much of an API error response body is read
// into the returned domain error so a large or malicious response cannot
// inflate memory or the error message.
const maxAPIErrorBodyBytes = 64 * 1024

// handleAPIError creates a domain error from an HTTP response. The response
// body is capped at maxAPIErrorBodyBytes; if truncation occurs a marker is
// appended so callers can tell the message is incomplete.
func (c *Client) handleAPIError(resp *http.Response) error {
	body, _ := io.ReadAll(io.LimitReader(resp.Body, maxAPIErrorBodyBytes+1))
	truncated := false
	if len(body) > maxAPIErrorBodyBytes {
		body = body[:maxAPIErrorBodyBytes]
		truncated = true
	}
	msg := string(body)
	if truncated {
		msg += "...[truncated]"
	}
	return domain.ErrAPIRequest{
		StatusCode: resp.StatusCode,
		Message:    msg,
	}
}

// formatFiles converts domain.GistFile map to GitHub API format
func (c *Client) formatFiles(files map[string]domain.GistFile) map[string]map[string]string {
	apiFiles := make(map[string]map[string]string)

	for filename, file := range files {
		// Use the filename from the key, but prefer the one in the file struct if set
		name := filename
		if file.Filename != "" {
			name = file.Filename
		}

		apiFiles[name] = map[string]string{
			"content": file.Content,
		}
	}

	return apiFiles
}
