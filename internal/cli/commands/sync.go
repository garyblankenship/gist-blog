package commands

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
	"gist/internal/service"
)

// SyncCommand handles the 'sync' command to sync gists from GitHub
type SyncCommand struct {
	service *service.GistService
}

// NewSyncCommand creates a new sync command
func NewSyncCommand(service *service.GistService) *cobra.Command {
	sc := &SyncCommand{service: service}

	cmd := &cobra.Command{
		Use:   "sync",
		Short: "Sync gists from GitHub",
		Long: `Force a sync of gists from GitHub to local cache.

This command will refresh your local gist cache by fetching the latest
gists from your GitHub account, overwriting any locally cached versions.`,
		RunE: sc.Run,
	}

	return cmd
}

// Run executes the sync command
func (c *SyncCommand) Run(cmd *cobra.Command, args []string) error {
	ctx := context.Background()

	fmt.Println("Syncing gists from GitHub...")

	// Force refresh from GitHub
	gists, err := c.service.SyncGists(ctx)
	if err != nil {
		return fmt.Errorf("sync gists: %w", err)
	}

	fmt.Printf("✓ Synced %d gist(s)\n", len(gists))
	return nil
}