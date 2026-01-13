package commands

import (
	"context"
	"fmt"
	"os"
	"sort"
	"strings"
	"text/tabwriter"

	"github.com/spf13/cobra"
	"gist/internal/domain"
	"gist/internal/service"
)

// ListCommand handles the 'list' command to show all gists
type ListCommand struct {
	service    *service.GistService
	tag        string
	showTags   bool
}

// NewListCommand creates a new list command
func NewListCommand(service *service.GistService) *cobra.Command {
	lc := &ListCommand{service: service}

	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List all gists",
		Long:    `List all gists from your GitHub account.
Use --tag to filter by specific tags or --tags to show all available tags.`,
		RunE: lc.Run,
	}

	cmd.Flags().StringVarP(&lc.tag, "tag", "t", "", "Filter by tag")
	cmd.Flags().BoolVar(&lc.showTags, "tags", false, "Show all available tags")

	return cmd
}

// Run executes the list command
func (c *ListCommand) Run(cmd *cobra.Command, args []string) error {
	ctx := context.Background()

	// Get all gists
	gists, err := c.service.ListGists(ctx)
	if err != nil {
		return fmt.Errorf("list gists: %w", err)
	}

	if len(gists) == 0 {
		fmt.Println("No gists found")
		fmt.Println("Create your first gist with 'gist publish <file>'")
		return nil
	}

	// Show tags if requested
	if c.showTags {
		c.displayTags(gists)
		return nil
	}

	// Filter by tag if specified
	if c.tag != "" {
		gists = c.filterByTag(gists, c.tag)
		if len(gists) == 0 {
			fmt.Printf("No gists found with tag #%s\n", c.tag)
			return nil
		}
	}

	// Sort by creation date (newest first)
	sort.Slice(gists, func(i, j int) bool {
		return gists[i].CreatedAt.After(gists[j].CreatedAt)
	})

	// Display gists
	c.displayGists(gists)

	return nil
}

// displayGists shows gists in a formatted table
func (c *ListCommand) displayGists(gists []domain.Gist) {
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tCREATED\tFILES\tDESCRIPTION")
	
	for _, gist := range gists {
		files := c.getFileList(gist)
		
		// Prefix private gists with +
		if !gist.Public {
			files = "+" + files
		}
		
		desc := gist.Description
		if desc == "" {
			desc = "(no description)"
		}
		if len(desc) > 10 {
			desc = desc[:10] + "..."
		}
		
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\n",
			gist.ID.String()[:8],
			gist.CreatedAt.Format("2006-01-02"),
			files,
			desc,
		)
	}
	
	w.Flush()
}

// getFileList returns a comma-separated list of files in a gist
func (c *ListCommand) getFileList(gist domain.Gist) string {
	var files []string
	for filename := range gist.Files {
		files = append(files, filename)
	}
	sort.Strings(files)
	
	if len(files) > 3 {
		return fmt.Sprintf("%s... (%d files)", strings.Join(files[:3], ", "), len(files))
	}
	
	return strings.Join(files, ", ")
}

// displayTags displays all unique tags from gist descriptions
func (c *ListCommand) displayTags(gists []domain.Gist) {
	tagMap := make(map[string]int)
	
	for _, gist := range gists {
		tags := extractTags(gist.Description)
		for _, tag := range tags {
			tagMap[tag]++
		}
	}
	
	if len(tagMap) == 0 {
		fmt.Println("No tags found")
		return
	}
	
	// Sort tags by name
	var tags []string
	for tag := range tagMap {
		tags = append(tags, tag)
	}
	sort.Strings(tags)
	
	fmt.Println("Tags:")
	for _, tag := range tags {
		fmt.Printf("  #%-20s (%d gists)\n", tag, tagMap[tag])
	}
}

// filterByTag filters gists that contain the specified tag
func (c *ListCommand) filterByTag(gists []domain.Gist, tag string) []domain.Gist {
	var filtered []domain.Gist
	
	for _, gist := range gists {
		tags := extractTags(gist.Description)
		for _, t := range tags {
			if strings.EqualFold(t, tag) {
				filtered = append(filtered, gist)
				break
			}
		}
	}
	
	return filtered
}

// extractTags extracts hashtags from a description
func extractTags(description string) []string {
	var tags []string
	words := strings.Fields(description)
	
	for _, word := range words {
		if strings.HasPrefix(word, "#") && len(word) > 1 {
			tag := strings.TrimPrefix(word, "#")
			// Remove trailing punctuation
			tag = strings.TrimRight(tag, ".,!?;:")
			if tag != "" {
				tags = append(tags, tag)
			}
		}
	}
	
	return tags
}