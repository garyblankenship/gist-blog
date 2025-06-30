# Git-Style CLI Guide

The new `gist` command provides a familiar git-like interface for managing your blog posts.

## Installation

```bash
# Build and install
make build
make install-cli

# Or manually
go build -o gist gist.go
sudo cp gist /usr/local/bin/
```

## Initial Setup

```bash
# Initialize configuration
gist init

# Enter your GitHub credentials when prompted
GitHub username: your-username
GitHub token: ghp_your_token_here
```

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

# Output:
Changes to be pushed (2):

  new file:   my-post.md
              → My Post Title #tag1 #tag2
  new file:   another.md
              → Another Post #blog

Run 'gist push' to upload changes
```

### 4. Push to GitHub

```bash
gist push

# Output:
Pushing 2 change(s) to GitHub...

✓ Uploaded my-post.md
  → https://gary.info/gist/abc123def
✓ Uploaded another.md
  → https://gary.info/gist/789xyz456

Pushed 2 of 2 changes
```

## Managing Existing Posts

### Pull Latest

Always sync before making changes:

```bash
gist pull

# Output:
Pulling latest gists from GitHub...
✓ Synced 42 gists
  Tags: 15 unique tags
  Latest: Docker Best Practices
```

### List Posts

```bash
gist list

# Output:
ID       DESCRIPTION                    FILES           CREATED
──       ───────────                    ─────           ───────
abc123d  Docker Best Practices          docker.md       Jan 15
789xyz4  Python Tips                    tips.py         Jan 14
def456g  React Hooks Guide              hooks.md        Jan 10
```

### Search

```bash
gist search docker

# Output:
Found 3 gist(s) matching 'docker':

abc123d  Docker Best Practices
         Files: docker.md, Dockerfile
         URL: https://gary.info/gist/abc123d

def456g  Docker Compose Tutorial
         Files: tutorial.md
         URL: https://gary.info/gist/def456g
```

### Show Details

```bash
gist show abc123d

# Output:
Gist abc123def456
──────────────────────────────────────────────────
Description: Docker Best Practices #docker #devops
Created:     2024-01-15 14:30:45
Updated:     2024-01-16 09:15:22
Public:      true
URL:         https://gist.github.com/username/abc123def456
Blog URL:    https://gary.info/gist/abc123def456
Tags:        #docker, #devops

Files (2):
  • docker.md
    # Docker Best Practices...
  • Dockerfile
    FROM node:18-alpine...
```

## Modifying Posts

### Add Tags

```bash
# Add tags to existing gist
gist tag abc123d tutorial featured

# Check status
gist status
# Output: modified: gist abc123d (tags)

# Push changes
gist push
```

### Remove Posts

```bash
# Stage for deletion
gist rm abc123d

# Verify
gist status
# Output: deleted: gist abc123d

# Push deletion
gist push
```

### Toggle Visibility

```bash
# Toggle between public and private
gist toggle abc123d

# Output:
Toggle gist visibility:
  Docker Best Practices
  Current: public
  New:     private

Continue? (y/N): y
✓ Gist abc123d is now private
```

## Advanced Features

### View History

```bash
gist log

# Shows last 20 posts with tags and dates
abc123d Docker Best Practices
Date: Mon Jan 15 14:30:45 2024
Tags: #docker, #devops, #tutorial

789xyz4 Python Tips
Date: Sun Jan 14 09:22:11 2024
Tags: #python, #programming
```

### Show Staged Changes

```bash
gist diff

# Output:
Staged changes (3):

+++ new-post.md
Description: New Blog Post #new
Public: true
Content preview:
  # New Blog Post
  This is my new post about...
  ... (45 more lines)

--- gist abc123d
Description: Docker Best Practices
  - docker.md
  - Dockerfile

~~~ gist def456g
New tags: #featured #pinned
```

### Reset Changes

```bash
# Unstage all changes
gist reset

# Output:
This will unstage 3 change(s). Continue? (y/N): y
✓ Reset staging area
```

## Configuration

### View Config

```bash
gist config

# Output:
github.user = your-username
github.token = ghp_...7890
```

### Update Config

```bash
# Change username
gist config github.user newusername

# Update token
gist config github.token ghp_new_token_here
```

## Command Reference

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

## Tips & Tricks

### Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
alias gs='gist status'
alias ga='gist add'
alias gp='gist push'
alias gl='gist list'
alias gd='gist diff'
```

### Workflow Script

Create a publish script:

```bash
#!/bin/bash
# publish.sh

# Check if file provided
if [ -z "$1" ]; then
  echo "Usage: ./publish.sh <file> [description]"
  exit 1
fi

# Default description
DESC="${2:-$(basename $1 .md)}"

# Stage and push
gist add -p -d "$DESC" "$1"
gist push
```

### Auto-sync

Add to crontab for hourly sync:

```bash
0 * * * * /usr/local/bin/gist pull
```

## Troubleshooting

### Permission Denied

```bash
# If /usr/local/bin is not writable
sudo make install-cli

# Or install to user directory
mkdir -p ~/bin
cp gist ~/bin/
export PATH="$HOME/bin:$PATH"
```

### Token Issues

```bash
# Test token
gist config
gist pull

# If fails, update token
gist config github.token ghp_new_token
```

### Cache Problems

```bash
# Clear and rebuild cache
gist clean
gist pull
```

## Migration from Legacy Tools

### From upload-gist

```bash
# Old way
./upload-gist -p -d "Title #tag" file.md

# New way
gist add -p -d "Title #tag" file.md
gist push
```

### From gist-manager

```bash
# Old way
./gist-manager sync
./gist-manager add-tag abc123 featured

# New way
gist pull
gist tag abc123 featured
gist push
```

## Best Practices

1. **Always pull before making changes**
   ```bash
   gist pull
   gist status
   ```

2. **Use descriptive commit messages**
   ```bash
   gist add post.md -d "Tutorial: Docker multi-stage builds #docker #tutorial"
   ```

3. **Review before pushing**
   ```bash
   gist diff
   gist push
   ```

4. **Keep cache fresh**
   ```bash
   # Pull regularly
   gist pull
   ```

5. **Organize with tags**
   ```bash
   gist tag old-post-id archive deprecated
   ```