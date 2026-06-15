package cache

import (
	"encoding/json"
	"os"
	"testing"
	"time"

	"gist/internal/domain"
	"gist/internal/service"
)

// memFS is an in-memory service.FileSystem so cache tests don't depend on
// OSFileSystem's disk behavior (covered in storage's own tests).
type memFS struct {
	files map[string][]byte
}

func newMemFS() *memFS { return &memFS{files: map[string][]byte{}} }

func (m *memFS) Exists(path string) bool { _, ok := m.files[path]; return ok }

func (m *memFS) ReadFile(path string) ([]byte, error) {
	b, ok := m.files[path]
	if !ok {
		return nil, os.ErrNotExist
	}
	return b, nil
}

func (m *memFS) WriteFile(path string, content []byte) error {
	m.files[path] = content
	return nil
}

func (m *memFS) Size(path string) (int64, error) {
	b, ok := m.files[path]
	if !ok {
		return 0, os.ErrNotExist
	}
	return int64(len(b)), nil
}

func (m *memFS) RemoveAll(path string) error {
	for k := range m.files {
		if k == path {
			delete(m.files, k)
		}
	}
	return nil
}

// compile-time interface check.
var _ service.FileSystem = (*memFS)(nil)

func sampleGists() []domain.Gist {
	return []domain.Gist{{ID: "abc123def4567890", Description: "hello", Public: true}}
}

func TestFileCache_SaveGet_RoundTrip(t *testing.T) {
	fs := newMemFS()
	c := NewFileCacheWithConfig(t.TempDir(), fs, domain.CacheConfig{TTL: 5 * time.Minute})

	if err := c.SaveGists(sampleGists()); err != nil {
		t.Fatalf("SaveGists: %v", err)
	}
	if c.IsStale() {
		t.Error("cache should be fresh right after save")
	}
	got, err := c.GetGists()
	if err != nil {
		t.Fatalf("GetGists: %v", err)
	}
	if len(got) != 1 || string(got[0].ID) != "abc123def4567890" {
		t.Errorf("unexpected gists: %+v", got)
	}
}

func TestFileCache_IsStale_Expired(t *testing.T) {
	fs := newMemFS()
	c := NewFileCacheWithConfig(t.TempDir(), fs, domain.CacheConfig{TTL: time.Minute})

	// Write a payload whose FetchedAt is well past the TTL.
	old := cachePayload{FetchedAt: time.Now().Add(-10 * time.Minute), Gists: sampleGists()}
	data, err := json.Marshal(old)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	fs.files[c.cacheFile] = data

	if !c.IsStale() {
		t.Error("cache with old FetchedAt should be stale")
	}
	got, err := c.GetGists()
	if err != nil || len(got) != 1 {
		t.Errorf("stale gists should still be readable, got %v err=%v", got, err)
	}
}

func TestFileCache_LegacyBareArray_TreatedAsMiss(t *testing.T) {
	fs := newMemFS()
	c := NewFileCacheWithConfig(t.TempDir(), fs, domain.CacheConfig{TTL: 5 * time.Minute})

	// Legacy format: a bare []Gist with no wrapper.
	legacy, err := json.Marshal(sampleGists())
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	fs.files[c.cacheFile] = legacy

	if !c.IsStale() {
		t.Error("legacy-format cache should be treated as stale (force refresh)")
	}
	if _, err := c.GetGists(); err == nil {
		t.Error("legacy-format cache GetGists should return a miss error")
	}
}

func TestFileCache_IsStale_NoFile(t *testing.T) {
	fs := newMemFS()
	c := NewFileCacheWithConfig(t.TempDir(), fs, domain.CacheConfig{TTL: 5 * time.Minute})

	if !c.IsStale() {
		t.Error("missing cache file should be stale")
	}
	if _, err := c.GetGists(); err == nil {
		t.Error("expected miss error when no cache file")
	}
}
