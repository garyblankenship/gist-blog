package service

import (
	"context"

	"gist/internal/domain"
)

// GistRepository defines the contract for gist storage operations
type GistRepository interface {
	// GetAll retrieves all gists for the authenticated user
	GetAll(ctx context.Context) ([]domain.Gist, error)
	
	// GetByID retrieves a specific gist by ID
	GetByID(ctx context.Context, id domain.GistID) (*domain.Gist, error)
	
	// Create creates a new gist
	Create(ctx context.Context, gist *domain.Gist) error
	
	// Update updates an existing gist
	Update(ctx context.Context, gist *domain.Gist) error
	
	// ToggleVisibility toggles public/private status
	ToggleVisibility(ctx context.Context, id domain.GistID) error
}

// StagingRepository is deprecated - will be removed in next version
type StagingRepository interface {
	GetStaged() ([]domain.StagedFile, error)
	AddToStaging(file domain.StagedFile) error
	RemoveFromStaging(path string) error
	ClearStaging() error
	SaveStaging(staged []domain.StagedFile) error
}

// CacheRepository defines the contract for local caching operations
type CacheRepository interface {
	// GetGists retrieves cached gists
	GetGists() ([]domain.Gist, error)
	
	// SaveGists caches gists locally
	SaveGists(gists []domain.Gist) error
	
	// IsStale checks if cache needs refreshing
	IsStale() bool
	
	// Clear removes all cached data
	Clear() error
}

// FileSystem defines the contract for file system operations
type FileSystem interface {
	// Exists checks if a file exists
	Exists(path string) bool
	
	// ReadFile reads file contents
	ReadFile(path string) ([]byte, error)
	
	// WriteFile writes content to a file
	WriteFile(path string, content []byte) error
	
	// RemoveAll removes a directory and all contents
	RemoveAll(path string) error
}

// ConfigRepository defines the contract for configuration operations
type ConfigRepository interface {
	// Load retrieves configuration
	Load() (*domain.Config, error)
	
	// Save persists configuration
	Save(config *domain.Config) error
	
	// GetFromEnv loads config from environment variables
	GetFromEnv() (*domain.Config, error)
}