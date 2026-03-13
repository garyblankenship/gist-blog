package commands

import (
	"context"

	"gist/internal/domain"
)

// GistService defines the service operations needed by CLI commands.
type GistService interface {
	ListGists(ctx context.Context) ([]domain.Gist, error)
	GetGist(ctx context.Context, id string) (*domain.Gist, error)
	PublishFiles(ctx context.Context, paths []string, description string, public bool) (string, error)
	SyncGists(ctx context.Context) ([]domain.Gist, error)
	UpdateGist(ctx context.Context, id domain.GistID, gist domain.Gist) error
}
