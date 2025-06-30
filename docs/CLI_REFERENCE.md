# CLI Reference

Complete reference for all Gist Blog command-line tools.

## Table of Contents

- [Configuration](#configuration) - Setting up authentication
- [upload-gist](#upload-gist) - Upload files as gists
- [gist-manager](#gist-manager) - Advanced gist management
- [gist-cli](#gist-cli) - Simple gist operations
- [Makefile](#makefile-commands) - Automation commands

---

## Configuration

The Gist CLI tools support multiple methods for authentication:

### 1. Environment Variables
```bash
export GITHUB_USER="your-github-username"
export GITHUB_TOKEN="ghp_your_token_here"
# or
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

### 2. .env File
Create a `.env` file in your project directory or home directory:
```env
GITHUB_USER=your-github-username
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

### 3. Interactive Setup
```bash
gist init
```

The tools check for configuration in this order:
1. `.env` file in current directory
2. `.env` file in home directory
3. Environment variables
4. `~/.gistconfig` file (created by `gist init`)

---

## upload-gist

Upload files to GitHub as gists with automatic blog integration.

### Usage

```bash
./upload-gist [options] file1 [file2 ...]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-d` | Description with #tags | None |
| `-p` | Make gist public | Private |
| `-t` | GitHub token (overrides env) | `$GITHUB_TOKEN` |

### Examples

```bash
# Upload single file publicly
./upload-gist -p -d "Docker Tutorial #docker #devops" tutorial.md

# Upload multiple files
./upload-gist -p -d "Project Files #golang" main.go config.yaml README.md

# Private gist (default)
./upload-gist -d "Internal Notes #private" notes.md

# Override token
./upload-gist -t ghp_different_token -p -d "Test #test" test.md
```

### Output

```
✓ Gist created successfully!

URL: https://gist.github.com/username/abc123def456
ID:  abc123def456

View on your blog: https://gary.info/gist/abc123def456

Uploaded files:
  - tutorial.md

Tags: #docker, #devops
```

---

## gist-manager

Advanced gist management with local caching and bulk operations.

### Commands

#### sync
Download all gists to local cache.

```bash
./gist-manager sync
```

Output:
```
Fetching all gists from GitHub...
✓ Fetched 42 gists
```

#### list
Display cached gists sorted by creation date.

```bash
./gist-manager list [--tags=false]
```

Options:
- `--tags=false` - Hide tags in listing

Example output:
```
📝 Your Gists (42 total)
────────────────────────────────────────────────────────────────────────────────

1. Docker Best Practices
   ID: abc123def456
   Created: 2024-01-15 14:30
   Tags: #docker, #devops, #tutorial
   Files: docker-guide.md, Dockerfile
   Status: 🌐 Public

2. Personal Notes
   ID: 789xyz123456
   Created: 2024-01-14 09:15
   Files: notes.txt
   Status: 🔒 Private
```

#### search
Search gists by content, description, or filename.

```bash
./gist-manager search <query>
```

Example:
```bash
./gist-manager search docker

🔍 Search results for: docker
────────────────────────────────────────────────────────────────────────────────

Docker Best Practices
ID: abc123def456
URL: https://gary.info/gist/abc123def456
Tags: #docker, #devops
Files: docker-guide.md, Dockerfile
```

#### delete
Delete a gist (with confirmation).

```bash
./gist-manager delete <gist-id>
```

Example:
```bash
./gist-manager delete abc123def456
Delete gist: Docker Best Practices
Are you sure? (y/N): y
✓ Deleted gist abc123def456
```

#### add-file
Add a file to an existing gist.

```bash
./gist-manager add-file <gist-id> <filename>
```

Example:
```bash
./gist-manager add-file abc123def456 update.md
✓ Added update.md to gist abc123def456
```

#### add-tag
Add a hashtag to a gist's description.

```bash
./gist-manager add-tag <gist-id> <tag>
```

Example:
```bash
./gist-manager add-tag abc123def456 cloudnative
✓ Added tag #cloudnative to gist abc123def456
New description: Docker Best Practices #docker #devops #tutorial #cloudnative
```

### Cache Location

Local cache is stored in `.gist-cache/gists.json`

---

## gist-cli

Simple gist operations (basic functionality).

### Commands

```bash
./gist-cli list                    # List all gists
./gist-cli upload <file> [desc]    # Upload file
./gist-cli delete <gist-id>        # Delete gist
```

---

## Makefile Commands

Convenient shortcuts for common operations.

### Basic Commands

```bash
make help     # Show all available commands
make dev      # Start local development server
make deploy   # Deploy to Cloudflare Workers
make build    # Build all Go tools
make clean    # Remove build artifacts
```

### Gist Management

```bash
make sync     # Sync all gists to local cache
make list     # List all cached gists
```

### Upload

```bash
make upload FILE=post.md DESC="My Post #blog"
```

### Search

```bash
make search Q="docker"     # Search for "docker"
make search Q="tag:golang" # Search for #golang tag
```

### Tag Management

```bash
make add-tag ID=abc123 TAG=featured
```

### Development

```bash
make tail     # View Cloudflare Worker logs
```

### Examples

```bash
# Full workflow
make sync                                      # Get latest gists
make search Q="tutorial"                       # Find tutorials
make add-tag ID=abc123 TAG=featured          # Add featured tag
make upload FILE=new.md DESC="New Post #new"  # Upload new post
make deploy                                    # Deploy changes
```

---

## Environment Variables

Required for all tools:

```bash
export GITHUB_USER="your-github-username"
export GITHUB_TOKEN="ghp_your_personal_access_token"
```

### Token Permissions

Your GitHub token needs these scopes:
- `gist` - Create and manage gists
- `read:user` - Read user profile (optional)

Create a token at: https://github.com/settings/tokens/new

---

## Tips & Tricks

### Batch Operations

```bash
# Add "archived" tag to all gists
for id in $(./gist-manager list | grep "ID:" | awk '{print $2}'); do
  ./gist-manager add-tag "$id" "archived"
done

# Delete all gists with "temp" tag
./gist-manager search "#temp" | grep "ID:" | awk '{print $2}' | \
  xargs -I {} ./gist-manager delete {}
```

### JSON Export

```bash
# Pretty print all gists
./gist-manager sync
cat .gist-cache/gists.json | jq '.'

# Extract all IDs
cat .gist-cache/gists.json | jq -r '.[].id'

# Find gists by tag
cat .gist-cache/gists.json | \
  jq '.[] | select(.description | contains("#docker"))'
```

### Automation

```bash
# Cron job to sync every hour
0 * * * * cd /path/to/gist-blog && ./gist-manager sync

# Auto-deploy on new gist
./gist-manager sync
if [ $? -eq 0 ]; then
  wrangler deploy
fi
```

---

## Troubleshooting

### Authentication Issues

```bash
# Test token
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user

# Check scopes
curl -I -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user | grep x-oauth-scopes
```

### Cache Problems

```bash
# Clear cache
rm -rf .gist-cache/

# Force resync
./gist-manager sync
```

### Rate Limiting

GitHub API limits:
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour

Check remaining:
```bash
curl -I -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/users/$GITHUB_USER | \
     grep x-ratelimit
```