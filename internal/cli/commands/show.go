package commands

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"gist/internal/domain"
	"gist/internal/service"
)

// ShowCommand handles the 'show' command to display gist details
type ShowCommand struct {
	service *service.GistService
}

// NewShowCommand creates a new show command
func NewShowCommand(service *service.GistService) *ShowCommand {
	return &ShowCommand{
		service: service,
	}
}

// Name returns the command name
func (c *ShowCommand) Name() string {
	return "show"
}

// Usage returns the usage string
func (c *ShowCommand) Usage() string {
	return "Show gist details"
}

// Execute runs the show command
func (c *ShowCommand) Execute(ctx context.Context, args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("gist ID required\nUsage: gist show <gist-id>")
	}
	
	gistID := args[0]
	
	// First try to get from cache
	gists, err := c.service.ListGists(ctx)
	if err != nil {
		return fmt.Errorf("get gists: %w", err)
	}
	
	// Find matching gist (supporting partial ID match)
	var gist *domain.Gist
	for i := range gists {
		if strings.HasPrefix(string(gists[i].ID), gistID) {
			gist = &gists[i]
			break
		}
	}
	
	if gist == nil {
		// Try fetching directly from GitHub
		fullGist, err := c.service.GetGist(ctx, gistID)
		if err != nil {
			return fmt.Errorf("gist not found: %s", gistID)
		}
		gist = fullGist
	}
	
	// Display gist details
	c.displayGist(gist)
	
	return nil
}

// displayGist shows detailed information about a gist
func (c *ShowCommand) displayGist(gist *domain.Gist) {
	fmt.Printf("Gist: %s\n", gist.ID)
	fmt.Printf("URL: %s\n", gist.HTMLURL)
	
	if gist.Description != "" {
		fmt.Printf("Description: %s\n", gist.Description)
	}
	
	visibility := "private"
	if gist.Public {
		visibility = "public"
	}
	fmt.Printf("Visibility: %s\n", visibility)
	
	fmt.Printf("Created: %s\n", gist.CreatedAt.Format("2006-01-02 15:04:05"))
	fmt.Printf("Updated: %s\n", gist.UpdatedAt.Format("2006-01-02 15:04:05"))
	
	fmt.Printf("\nFiles (%d):\n", len(gist.Files))
	
	// Sort files by name
	var filenames []string
	for name := range gist.Files {
		filenames = append(filenames, name)
	}
	sort.Strings(filenames)
	
	for _, filename := range filenames {
		file := gist.Files[filename]
		lines := strings.Count(file.Content, "\n") + 1
		size := len(file.Content)
		
		fmt.Printf("  - %s (%d lines, %d bytes)\n", filename, lines, size)
	}
	
	// Show content preview if only one file
	if len(gist.Files) == 1 {
		fmt.Println("\nContent preview:")
		fmt.Println(strings.Repeat("-", 60))
		
		for _, file := range gist.Files {
			content := file.Content
			lines := strings.Split(content, "\n")
			
			// Show first 20 lines
			maxLines := 20
			if len(lines) < maxLines {
				fmt.Print(content)
			} else {
				for i := 0; i < maxLines; i++ {
					fmt.Println(lines[i])
				}
				fmt.Printf("\n... (%d more lines)\n", len(lines)-maxLines)
			}
		}
		
		fmt.Println(strings.Repeat("-", 60))
	}
}