package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gist/internal/cli/commands"
	"gist/internal/domain"
	"gist/internal/service"
	"gist/internal/storage"
	"gist/internal/storage/cache"
	"gist/internal/storage/github"

	"github.com/spf13/cobra"
)

var version = "dev"

func main() {
	if err := run(context.Background()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	// Load .env file if present
	_ = storage.LoadEnvFile()

	// Initialize filesystem
	fs := storage.NewOSFileSystem()
	requiresConfig := shouldRequireConfig(os.Args[1:])
	// Only initialize heavy services when needed
	var gistService commands.GistService
	var config *domain.Config
	var githubClient *github.Client
	var fileCache *cache.FileCache

	if requiresConfig {
		loadedConfig, err := storage.LoadConfig(fs)
		if err != nil {
			var cfgErr domain.ErrConfigMissing
			if errors.As(err, &cfgErr) {
				return fmt.Errorf("%w; run 'gist init' to configure GitHub credentials", err)
			}
			return err
		}
		config = loadedConfig

		home, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("determine home directory: %w", err)
		}
		cacheDir := filepath.Join(home, ".gist-cache")
		githubClient = github.NewClient(config.GitHubToken, config.GitHubUser)
		fileCache = cache.NewFileCacheWithConfig(cacheDir, fs, config.Cache)
	}

	// Initialize context for cache cleanup
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Start cache cleanup when configured
	if fileCache != nil {
		fileCache.StartCleanup(ctx)
		gistService = service.NewGistService(
			githubClient, // GistRepository
			fileCache,    // CacheRepository
			fs,           // FileSystem
			config,       // Config
		)
	}

	// Root command
	rootCmd := &cobra.Command{
		Use:   "gist",
		Short: "Manage GitHub gists from the command line",
		Long: `Gist CLI - A git-style interface for managing GitHub gists.

Complete documentation is available at https://github.com/garyblankenship/gist-blog`,
		Version: version,
		RunE: func(cmd *cobra.Command, args []string) error {
			return cmd.Help()
		},
		SilenceUsage: true,
	}
	rootCmd.InitDefaultVersionFlag()

	// Add init command
	initCmd := &cobra.Command{
		Use:     "init",
		Short:   "Initialize gist configuration",
		Long:    "Set up your GitHub configuration for gist-cli.\n\nThis command will prompt you for your GitHub username and a personal access token with 'gist' scope. The configuration will be saved locally for future use.",
		Run:     func(cmd *cobra.Command, args []string) { setupConfiguration(fs) },
		Aliases: []string{"configure"},
	}
	rootCmd.AddCommand(initCmd)

	// Register commands
	rootCmd.AddCommand(commands.NewPublishCommand(gistService))
	rootCmd.AddCommand(commands.NewListCommand(gistService))
	rootCmd.AddCommand(commands.NewShowCommand(gistService))
	rootCmd.AddCommand(commands.NewSyncCommand(gistService))
	rootCmd.AddCommand(commands.NewTuiCommand(gistService))

	// Bind the cancellable context so every command can use cmd.Context()
	// and signal-based cancellation (Ctrl-C) reaches in-flight requests.
	rootCmd.SetContext(ctx)

	// Execute
	if err := rootCmd.Execute(); err != nil {
		return err
	}

	return nil
}

func shouldRequireConfig(args []string) bool {
	for _, arg := range args {
		switch arg {
		case "--help", "-h", "help", "--version", "-v", "version":
			return false
		}
	}

	for _, arg := range args {
		if strings.HasPrefix(arg, "-") {
			continue
		}
		return arg != "init"
	}

	return false
}

func setupConfiguration(fs *storage.OSFileSystem) {
	fmt.Println("Setting up gist configuration...")
	fmt.Println()

	var username, token string

	fmt.Print("GitHub username: ")
	_, _ = fmt.Scanln(&username)

	fmt.Print("GitHub token: ")
	_, _ = fmt.Scanln(&token)

	if username == "" || token == "" {
		fmt.Fprintln(os.Stderr, "Error: Both username and token are required")
		os.Exit(1)
	}

	configRepo := storage.NewConfigFile(fs)

	config := domain.NewConfig(username, token)

	if err := configRepo.Save(config); err != nil {
		fmt.Fprintf(os.Stderr, "Error saving configuration: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("✓ Configuration saved successfully")
	fmt.Println("You can now use gist commands")
}
