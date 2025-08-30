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
go build -o gist gist.go

# Install to system path
sudo cp gist /usr/local/bin/
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

### 2. Stage Changes

```bash
# Stage a new post (private by default)
gist add my-post.md -d "My Post Title #tag1 #tag2"

# Stage as public post
gist add -p my-post.md -d "Public Post #blog"

# Stage multiple files
gist add file1.md file2.md -d "Multi-file post"
```

### 3. Check Status

```bash
gist status

# Example output:
# Changes to be pushed (2):
#   new file:   my-post.md
#               → My Post Title #tag1 #tag2
#   new file:   another.md
#               → Another Post #blog
```

### 4. Push to GitHub

```bash
gist push
```

## Commands Reference

| Command | Alias | Description |
|---------|-------|-------------|
| `gist init` | | Initialize configuration |
| `gist status` | `st` | Show staged changes |
| `gist add` | | Stage files for upload |
| `gist rm` | `remove` | Stage gist for deletion |
| `gist tag` | | Add tags to a gist |
| `gist push` | | Upload changes to GitHub |
| `gist pull` | | Sync from GitHub |
| `gist list` | `ls` | List all gists |
| `gist show` | | Show gist details |
| `gist log` | | Show gist history |
| `gist diff` | | Show staged changes |
| `gist search` | | Search gists |
| `gist reset` | | Unstage all changes |
| `gist config` | | Manage configuration |
| `gist clean` | | Remove cache |
| `gist help` | | Show help |
| `gist version` | | Show version |

## Advanced Features

### Manage Existing Posts

```bash
# Pull latest gists
gist pull

# List posts
gist list

# Search gists
gist search docker

# Show gist details
gist show abc123d
```

### Modify Posts

```bash
# Add tags
gist tag abc123d tutorial featured

# Remove post
gist rm abc123d

# Toggle visibility
gist toggle abc123d
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
gist pull

# Update token if needed
gist config github.token ghp_new_token
```

### Cache Problems

```bash
# Clear and rebuild cache
gist clean
gist pull
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