package github

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"gist/internal/domain"
)

// newTestClient points a Client at the test server with fast retry timing so
// backoff does not slow the tests.
func newTestClient(t *testing.T, srv *httptest.Server) *Client {
	t.Helper()
	c := NewClient("test-token", "test-user")
	c.baseURL = srv.URL
	c.retryWait = time.Millisecond
	return c
}

// okBody decodes cleanly into domain.Gist (tags: id/description/public).
const okBody = `{"id":"abc123def4567890","description":"hello","public":true}`

type respSpec struct {
	status  int
	body    string
	headers map[string]string
}

// scriptedHandler returns the scripted responses in order, then a 200 okBody
// default once the script is exhausted. It records the call count and methods.
type scriptedHandler struct {
	mu       sync.Mutex
	responses []respSpec
	calls    int
	methods  []string
}

func (h *scriptedHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.mu.Lock()
	h.calls++
	h.methods = append(h.methods, r.Method)
	idx := h.calls - 1
	rs := respSpec{status: http.StatusOK, body: okBody}
	if idx < len(h.responses) {
		rs = h.responses[idx]
	}
	h.mu.Unlock()

	for k, v := range rs.headers {
		w.Header().Set(k, v)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(rs.status)
	if rs.body != "" {
		_, _ = w.Write([]byte(rs.body))
	}
}

func (h *scriptedHandler) count() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.calls
}

func TestClient_GetByID_Success(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusOK, body: okBody},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	g, err := newTestClient(t, srv).GetByID(context.Background(), "abc123def4567890")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if g == nil || string(g.ID) != "abc123def4567890" {
		t.Errorf("unexpected gist: %+v", g)
	}
}

func TestClient_GET_RetriesOn5xxThenSucceeds(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusInternalServerError, body: `{"message":"err"}`},
		{status: http.StatusInternalServerError, body: `{"message":"err"}`},
		{status: http.StatusInternalServerError, body: `{"message":"err"}`},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	g, err := newTestClient(t, srv).GetByID(context.Background(), "abc123def4567890")
	if err != nil {
		t.Fatalf("expected success after retries, got %v", err)
	}
	if g == nil {
		t.Fatal("expected gist, got nil")
	}
	if got := h.count(); got != 4 { // 3 fives + 1 default success
		t.Errorf("expected 4 calls, got %d", got)
	}
}

func TestClient_POST_NotRetriedOn5xx(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusInternalServerError, body: `{"message":"boom"}`},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	err := newTestClient(t, srv).Create(context.Background(), domain.NewGist("", "desc", true))
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if got := h.count(); got != 1 {
		t.Errorf("POST must not retry on 5xx; expected 1 call, got %d", got)
	}
}

func TestClient_GET_429_RetryAfter(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusTooManyRequests, headers: map[string]string{"Retry-After": "0"}},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	if _, err := newTestClient(t, srv).GetByID(context.Background(), "abc123def4567890"); err != nil {
		t.Fatalf("expected success after 429 retry, got %v", err)
	}
	if got := h.count(); got != 2 { // 429 then default 200
		t.Errorf("expected 2 calls, got %d", got)
	}
}

func TestClient_GET_403_RateLimitExhausted(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusForbidden, headers: map[string]string{"X-RateLimit-Remaining": "0"}},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	if _, err := newTestClient(t, srv).GetByID(context.Background(), "abc123def4567890"); err != nil {
		t.Fatalf("expected success after rate-limit retry, got %v", err)
	}
	if got := h.count(); got != 2 {
		t.Errorf("expected 2 calls, got %d", got)
	}
}

func TestClient_GET_5xxErrorCarriesBody(t *testing.T) {
	const body = `{"message":"specific-error-text"}`
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusInternalServerError, body: body},
		{status: http.StatusInternalServerError, body: body},
		{status: http.StatusInternalServerError, body: body},
		{status: http.StatusInternalServerError, body: body},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	_, err := newTestClient(t, srv).GetByID(context.Background(), "abc123def4567890")
	if err == nil {
		t.Fatal("expected error after exhausted retries")
	}
	var apiErr domain.ErrAPIRequest
	if !errors.As(err, &apiErr) {
		t.Fatalf("expected domain.ErrAPIRequest, got %T: %v", err, err)
	}
	if apiErr.StatusCode != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", apiErr.StatusCode)
	}
	if !strings.Contains(apiErr.Message, "specific-error-text") {
		t.Errorf("error message should carry response body (proves body read before close), got %q", apiErr.Message)
	}
}

func TestClient_ContextCancel(t *testing.T) {
	h := &scriptedHandler{responses: []respSpec{
		{status: http.StatusInternalServerError, body: `{}`},
	}}
	srv := httptest.NewServer(h)
	defer srv.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := newTestClient(t, srv).GetByID(ctx, "abc123def4567890")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context.Canceled, got %v", err)
	}
}
