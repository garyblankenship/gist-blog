package cache

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gist/internal/domain"
	"gist/internal/service"
)

// FileCache implements caching using local JSON files
type FileCache struct {
	cacheDir    string
	cacheFile   string
	maxAge      time.Duration
	cleanupFreq time.Duration
	fs          service.FileSystem
}

// cachePayload wraps the cached gists with the time they were fetched so
// freshness can be judged from stored data rather than file mtime (which is
// unreliable under touch or clock skew).
type cachePayload struct {
	FetchedAt time.Time     `json:"fetched_at"`
	Gists     []domain.Gist `json:"gists"`
}

// NewFileCache creates a new file-based cache with default settings
func NewFileCache(cacheDir string, fs service.FileSystem) *FileCache {
	return NewFileCacheWithConfig(cacheDir, fs, domain.CacheConfig{
		TTL:         5 * time.Minute,
		CleanupFreq: time.Hour,
	})
}

// NewFileCacheWithConfig creates a new file-based cache with specified configuration
func NewFileCacheWithConfig(cacheDir string, fs service.FileSystem, config domain.CacheConfig) *FileCache {
	return &FileCache{
		cacheDir:    cacheDir,
		cacheFile:   filepath.Join(cacheDir, "gists.json"),
		maxAge:      config.TTL,
		cleanupFreq: config.CleanupFreq,
		fs:          fs,
	}
}

// GetGists retrieves cached gists
func (c *FileCache) GetGists() ([]domain.Gist, error) {
	if !c.fs.Exists(c.cacheFile) {
		return nil, os.ErrNotExist
	}

	data, err := c.fs.ReadFile(c.cacheFile)
	if err != nil {
		return nil, err
	}

	var payload cachePayload
	if err := json.Unmarshal(data, &payload); err != nil {
		// Unreadable or legacy-format cache: treat as a miss and refetch.
		return nil, os.ErrNotExist
	}

	return payload.Gists, nil
}

// SaveGists caches gists locally
func (c *FileCache) SaveGists(gists []domain.Gist) error {
	// Ensure cache directory exists before writing
	if err := os.MkdirAll(c.cacheDir, 0755); err != nil {
		return err
	}

	payload := cachePayload{FetchedAt: time.Now(), Gists: gists}
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}

	return c.fs.WriteFile(c.cacheFile, data)
}

// IsStale checks if cache needs refreshing
func (c *FileCache) IsStale() bool {
	if !c.fs.Exists(c.cacheFile) {
		return true
	}

	data, err := c.fs.ReadFile(c.cacheFile)
	if err != nil {
		return true
	}

	var payload cachePayload
	if err := json.Unmarshal(data, &payload); err != nil {
		return true
	}
	if payload.FetchedAt.IsZero() {
		return true // no fetch timestamp (legacy cache) → force refresh
	}

	return time.Since(payload.FetchedAt) > c.maxAge
}

// Clear removes all cached data
func (c *FileCache) Clear() error {
	return c.fs.RemoveAll(c.cacheDir)
}

// StartCleanup starts periodic cleanup of expired cache entries
func (c *FileCache) StartCleanup(ctx context.Context) {
	if c.cleanupFreq <= 0 {
		return
	}
	go func() {
		ticker := time.NewTicker(c.cleanupFreq)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := c.cleanup(); err != nil {
					// Log error but don't crash
					continue
				}
			case <-ctx.Done():
				return
			}
		}
	}()
}

// cleanup removes expired cache entries
func (c *FileCache) cleanup() error {
	entries, err := os.ReadDir(c.cacheDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// Skip the main gists.json file as it's managed separately
		if strings.Contains(entry.Name(), "gists.json") {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if time.Since(info.ModTime()) > c.maxAge {
			if err := os.Remove(filepath.Join(c.cacheDir, entry.Name())); err != nil {
				return err
			}
		}
	}
	return nil
}
