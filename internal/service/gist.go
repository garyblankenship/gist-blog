package service

import (
	"context"
	"fmt"
	"path/filepath"

	"gist/internal/domain"
)

// maxGistFileSize caps the size of a single file published as a gist, matching
// GitHub's per-file gist limit so a huge file is never fully buffered.
const maxGistFileSize = 1 * 1024 * 1024

// GistService orchestrates gist operations
type GistService struct {
	gistRepo  GistRepository
	cacheRepo CacheRepository
	fs        FileSystem
	config    *domain.Config
}

// NewGistService creates a new gist service with injected dependencies
func NewGistService(
	gistRepo GistRepository,
	cacheRepo CacheRepository,
	fs FileSystem,
	config *domain.Config,
) *GistService {
	return &GistService{
		gistRepo:  gistRepo,
		cacheRepo: cacheRepo,
		fs:        fs,
		config:    config,
	}
}

// PublishFiles creates a gist directly from files
func (s *GistService) PublishFiles(ctx context.Context, paths []string, description string, public bool) (string, error) {
	// Validate files exist and are within the size limit
	for _, path := range paths {
		if !s.fs.Exists(path) {
			return "", domain.ErrFileNotFound{Path: path}
		}
		size, err := s.fs.Size(path)
		if err != nil {
			return "", fmt.Errorf("stat file %s: %w", path, err)
		}
		if size > maxGistFileSize {
			return "", fmt.Errorf("file %s is too large: %d bytes (max %d)", path, size, maxGistFileSize)
		}
	}

	// Create gist with files
	gist := domain.NewGist("", description, public)

	for _, path := range paths {
		content, err := s.fs.ReadFile(path)
		if err != nil {
			return "", fmt.Errorf("read file %s: %w", path, err)
		}

		filename := filepath.Base(path)
		gist.AddFile(filename, string(content))
	}

	// Create the gist
	if err := s.gistRepo.Create(ctx, gist); err != nil {
		return "", fmt.Errorf("create gist: %w", err)
	}

	return string(gist.ID), nil
}

// ListGists retrieves all gists, using cache when possible
func (s *GistService) ListGists(ctx context.Context) ([]domain.Gist, error) {
	// Try cache first
	if !s.cacheRepo.IsStale() {
		if gists, err := s.cacheRepo.GetGists(); err == nil && len(gists) > 0 {
			return gists, nil
		}
	}

	// Fetch from GitHub
	gists, err := s.gistRepo.GetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetch gists: %w", err)
	}

	// Update cache
	if err := s.cacheRepo.SaveGists(gists); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to cache gists: %v\n", err)
	}

	return gists, nil
}

// SyncGists forces a refresh of gists from GitHub
func (s *GistService) SyncGists(ctx context.Context) ([]domain.Gist, error) {
	// Clear cache to force refresh
	_ = s.cacheRepo.Clear()

	// Fetch fresh data from GitHub
	return s.ListGists(ctx)
}

// GetGist retrieves a specific gist by ID
func (s *GistService) GetGist(ctx context.Context, id string) (*domain.Gist, error) {
	gistID := domain.GistID(id)
	if !gistID.Valid() {
		return nil, domain.ErrInvalidGistID{ID: id}
	}

	return s.gistRepo.GetByID(ctx, gistID)
}

