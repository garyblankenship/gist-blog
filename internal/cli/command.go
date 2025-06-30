package cli

import (
	"context"
	"fmt"
	"os"

	"gist/internal/service"
)

// Command defines the interface for all CLI commands
type Command interface {
	Name() string
	Usage() string
	Execute(ctx context.Context, args []string) error
}

// App holds the CLI application state
type App struct {
	commands map[string]Command
	service  *service.GistService
}

// NewApp creates a new CLI application
func NewApp(gistService *service.GistService) *App {
	return &App{
		commands: make(map[string]Command),
		service:  gistService,
	}
}

// Register adds a command to the application
func (a *App) Register(cmd Command) {
	a.commands[cmd.Name()] = cmd
}

// Run executes the CLI application
func (a *App) Run(args []string) {
	if len(args) < 2 {
		a.showUsage()
		os.Exit(0)
	}

	cmdName := args[1]
	cmdArgs := args[2:]

	// Handle built-in commands
	switch cmdName {
	case "help", "-h", "--help":
		a.showHelp()
		return
	case "version", "-v", "--version":
		fmt.Printf("gist version %s\n", "1.0.0")
		return
	}

	// Handle command aliases
	cmdName = a.resolveAlias(cmdName)

	// Find and execute command
	cmd, exists := a.commands[cmdName]
	if !exists {
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n", cmdName)
		fmt.Fprintln(os.Stderr, "Run 'gist help' for usage information")
		os.Exit(1)
	}

	ctx := context.Background()
	if err := cmd.Execute(ctx, cmdArgs); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

// showUsage displays basic usage information
func (a *App) showUsage() {
	fmt.Println("Gist CLI - Manage GitHub gists from the command line")
	fmt.Println()
	fmt.Println("Usage: gist <command> [arguments]")
	fmt.Println()
	fmt.Println("Commands:")
	
	// Display commands in a specific order
	commandOrder := []string{"publish", "list", "show", "sync", "tui"}
	for _, name := range commandOrder {
		if cmd, exists := a.commands[name]; exists {
			fmt.Printf("  %-12s %s\n", name, cmd.Usage())
		}
	}
	
	fmt.Println()
	fmt.Println("Configuration:")
	fmt.Println("  Set GITHUB_USER and GITHUB_TOKEN in environment or .env file")
	fmt.Println()
	fmt.Println("Run 'gist help' or 'gist <command> -h' for more information")
}

// showHelp displays detailed help information
func (a *App) showHelp() {
	a.showUsage()
	fmt.Println("Examples:")
	fmt.Println()
	fmt.Println("  # Create a private gist")
	fmt.Println("  gist publish script.sh -d \"Backup script\"")
	fmt.Println()
	fmt.Println("  # Create a public gist with multiple files")
	fmt.Println("  gist publish -p *.go -d \"Go examples #golang\"")
	fmt.Println()
	fmt.Println("  # List all gists")
	fmt.Println("  gist list")
	fmt.Println()
	fmt.Println("  # Show specific gist")
	fmt.Println("  gist show abc123")
	fmt.Println()
	fmt.Println("  # Filter by tag")
	fmt.Println("  gist list -t golang")
	fmt.Println()
	fmt.Println("  # Launch interactive TUI")
	fmt.Println("  gist tui")
}

// resolveAlias resolves command aliases to their canonical names
func (a *App) resolveAlias(cmdName string) string {
	aliases := map[string]string{
		"ls": "list",
	}
	
	if canonical, exists := aliases[cmdName]; exists {
		return canonical
	}
	
	return cmdName
}