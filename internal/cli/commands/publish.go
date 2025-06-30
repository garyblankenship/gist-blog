package commands

import (
	"context"
	"fmt"
	"os"

	"gist/internal/service"
)

// PublishCommand handles the 'publish' command to create gists from files
type PublishCommand struct {
	service *service.GistService
}

// NewPublishCommand creates a new publish command
func NewPublishCommand(service *service.GistService) *PublishCommand {
	return &PublishCommand{
		service: service,
	}
}

// Name returns the command name
func (c *PublishCommand) Name() string {
	return "publish"
}

// Usage returns the usage string
func (c *PublishCommand) Usage() string {
	return "Create a gist from files"
}

// Execute runs the publish command
func (c *PublishCommand) Execute(ctx context.Context, args []string) error {
	options, err := c.parseArgs(args)
	if err != nil {
		return err
	}

	if len(options.Files) == 0 {
		fmt.Fprintln(os.Stderr, "Error: no files specified")
		fmt.Fprintln(os.Stderr, "Usage: gist publish [-p] [-d description] <file> [files...]")
		os.Exit(1)
	}

	fmt.Printf("Publishing %d file(s) to GitHub...\n", len(options.Files))
	
	gistID, err := c.service.PublishFiles(ctx, options.Files, options.Description, options.Public)
	if err != nil {
		return fmt.Errorf("publish failed: %w", err)
	}
	
	fmt.Printf("✓ Created gist: %s\n", gistID)
	return nil
}

// PublishOptions holds the parsed command line options
type PublishOptions struct {
	Description string
	Public      bool
	Files       []string
}

// parseArgs parses command line arguments for the publish command
func (c *PublishCommand) parseArgs(args []string) (*PublishOptions, error) {
	opts := &PublishOptions{
		Description: "",
		Public:      false,
		Files:       []string{},
	}

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "-d", "--desc":
			if i+1 >= len(args) {
				return nil, fmt.Errorf("flag %s requires a value", args[i])
			}
			opts.Description = args[i+1]
			i++ // Skip the next argument
		case "-p", "--public":
			opts.Public = true
		case "-h", "--help":
			c.showHelp()
			os.Exit(0)
		default:
			// Assume it's a file path
			opts.Files = append(opts.Files, args[i])
		}
	}

	return opts, nil
}

// showHelp displays help for the publish command
func (c *PublishCommand) showHelp() {
	fmt.Println("Create a gist from files")
	fmt.Println()
	fmt.Println("Usage:")
	fmt.Println("  gist publish [options] <file> [files...]")
	fmt.Println()
	fmt.Println("Options:")
	fmt.Println("  -d, --desc <text>   Set description for the gist")
	fmt.Println("  -p, --public        Make the gist public (default: private)")
	fmt.Println("  -h, --help          Show this help message")
	fmt.Println()
	fmt.Println("Examples:")
	fmt.Println("  gist publish script.sh")
	fmt.Println("  gist publish -d \"Helper functions\" utils.go")
	fmt.Println("  gist publish -p -d \"Public example\" example.py")
}