# Gist CLI

A streamlined command-line interface for managing GitHub Gists, built with clean architecture principles in Go.

## Features

- 📝 **Direct Publishing** - Create gists directly from files without staging
- 📋 **List & Browse** - View all your public gists with compact formatting
- 🔍 **Search by Tags** - Filter gists using hashtags in descriptions
- 🔄 **Sync** - Keep your local cache up-to-date with GitHub
- 🔒 **Privacy Control** - Create private (default) or public gists
- 🎨 **Interactive TUI** - Terminal UI for managing gists with real-time updates
- 🏗️ **Clean Architecture** - Modular design with clear separation of concerns

## Installation

```bash
# Clone and install
git clone https://github.com/yourusername/gist
cd gist
./install.sh
```

The install script will:
1. Build the gist binary
2. Create a symlink in `~/go/bin/` (or `/usr/local/bin` as fallback)
3. Keep the binary in the project directory for easy updates

Make sure `~/go/bin` is in your PATH:
```bash
export PATH="$HOME/go/bin:$PATH"
```

## Configuration

The CLI reads configuration from multiple sources (in order):

1. Environment variables
2. `.env` file (current directory or home)
3. `~/.gistconfig` file

### Environment Variables

Create a `.env` file:

```bash
GITHUB_USER=yourusername
GITHUB_TOKEN=ghp_yourtoken
# or
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_yourtoken
```

### Required Token Scope

Your GitHub personal access token needs the `gist` scope to create and manage gists.

## Commands

### `gist publish`

Create a new gist from one or more files.

```bash
# Create a private gist (default)
gist publish script.sh

# Create a public gist
gist publish -p script.sh

# Add a description
gist publish -d "Useful bash utilities" *.sh

# Multiple files in one gist
gist publish main.go utils.go -d "Go example"
```

Options:
- `-p, --public` - Make the gist public (default: private)
- `-d, --desc <text>` - Add a description

### `gist list`

List all your public gists.

```bash
# List all gists
gist list

# Short alias
gist ls

# Filter by tag
gist list -t golang

# Show all tags
gist list --tags
```

Output format: `ID | CREATED | FILES | DESCRIPTION`

### `gist show`

Display details of a specific gist.

```bash
# Show gist details (supports partial ID)
gist show abc123

# Shows files, creation date, and content preview
```

### `gist sync`

Synchronize your local cache with GitHub.

```bash
# Force refresh from GitHub
gist sync
```

### `gist tui`

Launch an interactive terminal UI for managing gists.

```bash
# Start the TUI
gist tui
```

Features:
- Browse all gists in a scrollable list
- Toggle visibility (public/private) with Enter key
- Real-time updates to GitHub
- Filter gists by typing
- Keyboard shortcuts:
  - `↑/↓` - Navigate list
  - `Enter` or `Space` - Toggle visibility
  - `r` - Refresh list
  - `?` - Show help
  - `q` - Quit

## Architecture

The project follows clean architecture principles:

```
gist/
├── cmd/gist/          # Application entry point
├── internal/
│   ├── domain/        # Core business entities
│   ├── service/       # Business logic
│   ├── storage/       # External integrations
│   └── cli/           # CLI commands
└── go.mod
```

### Key Design Decisions

- **Zero Dependencies** - Uses only Go standard library
- **Interface Segregation** - Clean contracts between layers
- **Dependency Injection** - Testable and maintainable
- **Domain-Driven Design** - Business logic separated from infrastructure

## Examples

### Publishing a Configuration File

```bash
gist publish ~/.vimrc -d "My Vim configuration #vim #dotfiles"
```

### Creating a Multi-File Gist

```bash
gist publish *.go -p -d "Go web server example #golang"
```

### Finding Gists by Tag

```bash
# List all gists with #golang tag
gist list -t golang
```

## Caching

The CLI caches gist metadata locally for performance:
- Cache location: `~/.gist-cache/`
- Cache TTL: 5 minutes
- Force refresh: `gist sync`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details