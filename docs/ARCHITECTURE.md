# Project Structure

Detailed explanation of all files and directories in the Gist Blog project.

## Directory Layout

```
gist-blog/
├── .github/                    # GitHub-specific files
│   ├── FUNDING.yml            # Sponsorship configuration
│   └── ISSUE_TEMPLATE/        # Issue templates
│       ├── bug_report.md      # Bug report template
│       └── feature_request.md # Feature request template
│
├── cmd/gist/                   # Go CLI application
│   ├── main.go                # CLI entry point and command routing
│   └── internal/              # Internal packages
│       ├── cli/               # Command infrastructure and TUI
│       ├── domain/            # Core business entities
│       ├── service/           # Business services and GitHub API
│       └── storage/           # Data layer and caching
│
├── docs/                      # Documentation
│   ├── CLI_REFERENCE.md      # Complete CLI command reference
│   ├── QUICK_REFERENCE.md    # Quick command cheat sheet
│   └── ARCHITECTURE.md       # This file
│
├── .gist-cache/              # Local cache (git-ignored)
│   └── gists.json           # Cached gist data
│
├── node_modules/             # NPM dependencies (git-ignored)
│
├── .wrangler/                # Wrangler build cache (git-ignored)
│
├── Core Files
├── worker.js                 # Single-file Cloudflare Worker (1,071 lines)
│                           # with embedded CSS (STYLES constant)
│
├── Configuration
├── wrangler.toml            # Cloudflare Workers config
├── package.json             # Node.js project config
├── go.mod                   # Go module dependencies
├── Makefile                 # Automation commands
├── .gitignore               # Git ignore rules
│
├── Documentation
├── README.md                # Main project documentation
├── DEPLOYMENT_GUIDE.md      # Detailed deployment guide
├── LICENSE                  # MIT license
├── CLAUDE.md                # AI assistant instructions
└── example-post.md          # Example blog post
```

## File Purposes

### Core Worker Files

#### `worker.js`
- **Purpose**: Single-file production worker containing complete blog engine
- **Features**: All functionality including routing, caching, SEO, and rendering
- **Architecture**: 1,071 lines with embedded CSS via STYLES constant
- **Security**: Public gists only with proper input validation
- **When to use**: Standard deployment
- **Size**: ~107KB (compressed ~400KB)

### Go CLI Application

#### `cmd/gist/main.go`
- **Purpose**: CLI entry point and command router
- **Commands**: publish, list, show, sync, tui, config, clean, version
- **Features**: Git-style workflow with BubbleTea TUI
- **Dependencies**: Modern Go 1.23+ with XDG-compliant config

#### Internal Package Structure
```
internal/
├── cli/              # Command infrastructure and BubbleTea TUI
│   ├── cmd/         # Individual command implementations
│   ├── model.go     # Main TUI model
│   ├── styles.go    # Terminal styling utilities
│   └── keymap.go    # Keyboard shortcuts
│
├── domain/           # Core business entities
│   ├── gist.go      # Gist entity with methods
│   ├── config.go    # Configuration management
│   └── errors.go    # Custom error types
│
├── service/          # Business services and GitHub API
│   ├── github.go    # GitHub API client
│   ├── metrics.go   # Performance metrics collection
│   └── cache.go     # Caching service with connection pooling
│
└── storage/          # Data layer with caching
    ├── cache.go     # Local cache implementation
    ├── config.go    # Configuration storage
    └── storage.go   # Storage interface
```

### Configuration Files

#### `wrangler.toml`
- **Purpose**: Cloudflare Workers configuration
- **Contains**: Worker name, KV bindings, routes, environment variables

#### `package.json`
- **Purpose**: Node.js project metadata
- **Scripts**: dev, deploy, build, tail, sync, list, clean

#### `Makefile`
- **Purpose**: Task automation
- **Commands**: Common operations with simple syntax

### Build Tools

#### `build.js`
- **Status**: REMOVED - No longer needed with embedded CSS
- **Previous purpose**: Bundle styles into worker
- **Note**: CSS is now embedded directly in worker.js via STYLES constant

## Development Workflow

### 1. Local Development
```bash
# Development server for worker testing
npm run dev
# or
wrangler dev

# Build and install CLI tools
make build
make install-cli
```

### 2. Making Changes

**Worker Changes**: Edit `worker.js` directly
- CSS is embedded in the STYLES constant
- All functionality in single file for simplicity

**CLI Changes**: Edit files in `cmd/gist/`
- Main entry point: `cmd/gist/main.go`
- Individual commands in `internal/cli/cmd/`
- Business logic in service layer

### 3. Building for Production
```bash
# Build CLI tools
make build

# Deploy worker
npm run deploy
# or
wrangler deploy
```

## Module Dependencies

```
worker.js
  └── (self-contained - embedded CSS via STYLES constant)

cmd/gist/main.go
  ├── internal/cli/      # TUI and command infrastructure
  ├── internal/domain/    # Business entities
  ├── internal/service/   # Services (GitHub, Metrics, Cache)
  └── internal/storage/   # Data layer

Go Dependencies (go.mod)
  ├── bubbletea          # Terminal UI framework
  └── modern Go features (generics, errors.As, etc.)
```

## Cache Structure

### `.gist-cache/gists.json`
```json
[
  {
    "id": "abc123",
    "description": "Post Title",
    "public": true,
    "files": {
      "post.md": {
        "filename": "post.md",
        "content": "..."
      }
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "html_url": "https://gist.github.com/..."
  }
]
```

### KV Cache Structure
- Key: `gists-list` → All gists array
- Key: `gist-{id}` → Individual gist details
- TTL: 300 seconds (5 minutes)

## Adding New Features

### 1. New Route
```javascript
// In handleRequest()
case 'archive':
  return await this.showArchive();
```

### 2. New View Method
```javascript
// In GistBlog class
showArchive() {
  const gists = await this.getGists();
  const archived = gists.filter(g => g.tags.includes('archive'));
  return this.render('Archive', this.archiveView(archived));
}
```

### 3. New CLI Command
```go
// In cmd/gist/internal/cli/cmd/
package cmd

import (
  "github.com/charmbracelet/bubbletea"
)

type archiveCmd struct{}

func (a archiveCmd) Run() error {
  // Implementation in service layer
  service := service.NewArchiveService()
  return service.ArchiveGist(args...)
}
```

## Best Practices

1. **Always test locally first**: `wrangler dev`
2. **Keep workers small**: < 1MB compressed
3. **Use KV for caching**: Reduces API calls
4. **Version control**: Tag releases
5. **Document changes**: Update CHANGELOG.md

## Troubleshooting

### Module Import Issues
- Cloudflare Workers don't support all Node.js features
- Use build.js to bundle dependencies

### Size Limits
- Workers have a 1MB size limit (compressed)
- Remove unused code and comments
- Minify if necessary

### Performance
- Use KV caching aggressively
- Minimize GitHub API calls
- Consider increasing CACHE_TTL