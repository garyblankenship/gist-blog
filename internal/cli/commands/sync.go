package commands

import (
	"context"
	"fmt"

	"gist/internal/service"
)

// SyncCommand handles the 'sync' command to sync gists from GitHub
type SyncCommand struct {
	service *service.GistService
}

// NewSyncCommand creates a new sync command
func NewSyncCommand(service *service.GistService) *SyncCommand {
	return &SyncCommand{
		service: service,
	}
}

// Name returns the command name
func (c *SyncCommand) Name() string {
	return "sync"
}

// Usage returns the usage string
func (c *SyncCommand) Usage() string {
	return "Sync gists from GitHub"
}

// Execute runs the sync command
func (c *SyncCommand) Execute(ctx context.Context, args []string) error {
	fmt.Println("Syncing gists from GitHub...")
	
	// Force refresh from GitHub
	gists, err := c.service.SyncGists(ctx)
	if err != nil {
		return fmt.Errorf("sync gists: %w", err)
	}
	
	fmt.Printf("✓ Synced %d gist(s)\n", len(gists))
	return nil
}