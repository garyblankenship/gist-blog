# Gist CLI: Complete User Guide

## Overview

The Gist CLI is a powerful, git-style command-line tool for managing GitHub Gists, designed for seamless blog publishing and content management. Built with clean architecture principles, it provides a comprehensive set of tools for creating, managing, and synchronizing your blog posts.

## Features

- 📝 **Direct Publishing** - Create gists directly from files
- 📋 **List & Browse** - View all your public gists
- 🔍 **Search by Tags** - Filter gists using hashtags
- 🔄 **Sync** - Keep local cache up-to-date with GitHub
- 🔒 **Privacy Control** - Create private or public gists
- 🎨 **Interactive TUI** - Terminal UI for gist management

## Installation

### Quick Install

```bash
# Clone the repository
git clone https://github.com/yourusername/gist
cd gist

# Build and install
make build
make install-cli

# Verify installation
gist version
```

### Manual Installation

```bash
# Build binary
make build

# Install to system path
make install-cli

# Or manually
go build -o cmd/gist/main.go
sudo cp cmd/gist/main.go /usr/local/bin/gist
```

## Configuration

### Authentication Methods

1. **Environment Variables**
   ```bash
   export GITHUB_USER="your-github-username"
   export GITHUB_TOKEN="ghp_your_personal_access_token"
   ```

2. **Dotenv File**
   Create a `.env` file in your project or home directory:
   ```
   GITHUB_USER=your-username
   GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
   ```

3. **Interactive Setup**
   ```bash
   # Initialize configuration
   gist init
   ```

### Token Requirements

Your GitHub personal access token needs:
- `gist` scope to create and manage gists
- Optional `read:user` for profile access

## Basic Workflow

### 1. Create Content

Write your posts in Markdown:
```bash
vim my-post.md
```

### 2. Publish Post

```bash
# Publish a new post (public by default)
gist publish my-post.md -d "My Post Title #tag1 #tag2"

# Publish as private gist
gist publish -p my-post.md -d "Private Post #draft"

# Publish multiple files
gist publish file1.md file2.md -d "Multi-file post"
```

### 3. Sync Gists

```bash
# Pull latest gists from GitHub
gist sync

# Push local changes
gist push
```

## Commands Reference

| Command | Alias | Description |
|---------|-------|-------------|
| `gist publish` | | Create new gist from file |
| `gist list` | `ls` | List all gists |
| `gist show` | | Show gist details |
| `gist sync` | | Sync from GitHub |
| `gist tui` | | Interactive TUI interface |
| `gist config` | | Manage configuration |
| `gist clean` | | Remove cache |
| `gist help` | | Show help |
| `gist version` | | Show version |

## Advanced Features

### Manage Existing Posts

```bash
# List all posts
gist list

# Search gists by keyword
gist search docker

# Show specific gist details
gist show abc123d

# Start interactive TUI
gist tui
```

## Caching

- **Location**: `~/.gist-cache/`
- **TTL**: 5 minutes
- **Force Refresh**: `gist sync`

## Best Practices

1. Always pull before making changes
   ```bash
   gist pull
   gist status
   ```

2. Use descriptive commit messages
   ```bash
   gist add post.md -d "Tutorial: Docker multi-stage builds #docker #tutorial"
   ```

3. Review before pushing
   ```bash
   gist diff
   gist push
   ```

4. Keep cache fresh
   ```bash
   gist pull
   ```

5. Organize with tags
   ```bash
   gist tag old-post-id archive deprecated
   ```

## Troubleshooting

### Permission Issues

```bash
# If /usr/local/bin is not writable
sudo make install-cli

# Or install to user directory
mkdir -p ~/bin
cp gist ~/bin/
export PATH="$HOME/bin:$PATH"
```

### Token Problems

```bash
# Test configuration
gist config

# Update token if needed
wrangler secret put GITHUB_TOKEN
```

### Cache Problems

```bash
# Clear local cache
gist clean

# Re-sync from GitHub
gist sync
```

## Tips & Tricks

### Shell Aliases

Add to `.bashrc` or `.zshrc`:
```bash
alias gs='gist status'
alias ga='gist add'
alias gp='gist push'
alias gl='gist list'
alias gd='gist diff'
```

### Auto-sync

Add to crontab for hourly sync:
```bash
0 * * * * /usr/local/bin/gist pull
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details