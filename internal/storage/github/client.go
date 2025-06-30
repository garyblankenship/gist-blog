package github

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"gist/internal/domain"
)

// Client implements the GistRepository interface for GitHub API
type Client struct {
	httpClient *http.Client
	baseURL    string
	token      string
	username   string
}

// NewClient creates a new GitHub API client
func NewClient(token, username string) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		baseURL:    "https://api.github.com",
		token:      token,
		username:   username,
	}
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
	resp, err := c.apiRequest(ctx, "POST", url, bytes.NewReader(body))
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
	resp, err := c.apiRequest(ctx, "PATCH", url, bytes.NewReader(body))
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

// ToggleVisibility toggles public/private status
func (c *Client) ToggleVisibility(ctx context.Context, id domain.GistID) error {
	// First, get the current gist to know its current visibility
	gist, err := c.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Note: GitHub API doesn't support changing visibility after creation
	// The 'public' field is only settable at creation time
	// This will return success but won't actually change visibility
	_ = gist
	
	return fmt.Errorf("GitHub API does not support changing gist visibility after creation")
}

// apiRequest makes an authenticated request to the GitHub API
func (c *Client) apiRequest(ctx context.Context, method, url string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "Gist-CLI")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	return c.httpClient.Do(req)
}

// handleAPIError creates a domain error from an HTTP response
func (c *Client) handleAPIError(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)
	return domain.ErrAPIRequest{
		StatusCode: resp.StatusCode,
		Message:    string(body),
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