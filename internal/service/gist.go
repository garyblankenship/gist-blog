package service

import (
	"context"
	"fmt"
	"path/filepath"

	"gist/internal/domain"
)

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
	_ StagingRepository, // Deprecated - will be removed
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
	// Validate files exist
	for _, path := range paths {
		if !s.fs.Exists(path) {
			return "", domain.ErrFileNotFound{Path: path}
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

// ToggleGistVisibility toggles public/private status of a gist
func (s *GistService) ToggleGistVisibility(ctx context.Context, id string) error {
	gistID := domain.GistID(id)
	if !gistID.Valid() {
		return domain.ErrInvalidGistID{ID: id}
	}

	return s.gistRepo.ToggleVisibility(ctx, gistID)
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

// UpdateGist updates an existing gist
func (s *GistService) UpdateGist(ctx context.Context, id domain.GistID, gist domain.Gist) error {
	if !id.Valid() {
		return domain.ErrInvalidGistID{ID: string(id)}
	}

	// Ensure the gist has the correct ID
	gist.ID = id

	// Update in repository
	if err := s.gistRepo.Update(ctx, &gist); err != nil {
		return fmt.Errorf("update gist: %w", err)
	}

	// Clear cache to ensure fresh data
	_ = s.cacheRepo.Clear()

	return nil
}

