package commands

import (
	"context"
	"fmt"

	"github.com/spf13/cobra"
	"gist/internal/service"
)

// PublishCommand handles the 'publish' command to create gists from files
type PublishCommand struct {
	service     *service.GistService
	description string
	public      bool
	files       []string
}

// NewPublishCommand creates a new publish command
func NewPublishCommand(service *service.GistService) *cobra.Command {
	pc := &PublishCommand{service: service}

	cmd := &cobra.Command{
		Use:     "publish [files...]",
		Aliases: []string{"new"},
		Short:   "Create a gist from files",
		Long:    `Create a new GitHub gist from one or more files.
Gists can be public or private and support descriptions with tags (e.g., "#golang #tutorial").`,
		Args:    cobra.MinimumNArgs(1),
		RunE:    pc.Run,
	}

	cmd.Flags().StringVarP(&pc.description, "desc", "d", "", "Set description for the gist")
	cmd.Flags().BoolVarP(&pc.public, "public", "p", false, "Make the gist public (default: private)")

	return cmd
}

// Run executes the publish command
func (c *PublishCommand) Run(cmd *cobra.Command, args []string) error {
	ctx := context.Background()
	c.files = args

	fmt.Printf("Publishing %d file(s) to GitHub...\n", len(c.files))

	gistID, err := c.service.PublishFiles(ctx, c.files, c.description, c.public)
	if err != nil {
		return fmt.Errorf("publish failed: %w", err)
	}

	fmt.Printf("✓ Created gist: %s\n", gistID)
	return nil
}