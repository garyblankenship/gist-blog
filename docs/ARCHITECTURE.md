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
├── docs/                      # Documentation
│   ├── CLI_REFERENCE.md      # Complete CLI command reference
│   ├── QUICK_REFERENCE.md    # Quick command cheat sheet
│   └── PROJECT_STRUCTURE.md  # This file
│
├── public/                    # Legacy PHP version (archived)
│   └── index.php             # Original PHP implementation
│
├── .gist-cache/              # Local cache (git-ignored)
│   └── gists.json           # Cached gist data
│
├── node_modules/             # NPM dependencies (git-ignored)
│
├── .wrangler/                # Wrangler build cache (git-ignored)
│
├── Core Files
├── worker.js                 # Main Cloudflare Worker (production)
├── worker-enhanced.js        # Enhanced version with RSS/sitemap
├── worker-optimized.js       # Modular version using styles.js
├── styles.js                 # Extracted CSS and layout functions
├── build.js                  # Build script to inline styles
│
├── Go CLI Tools
├── upload-gist.go           # Quick gist upload tool
├── gist-manager.go          # Advanced management with caching
├── gist-cli.go              # Simple gist operations
├── gist.sh                  # Interactive shell menu
│
├── Configuration
├── wrangler.toml            # Cloudflare Workers config
├── package.json             # Node.js project config
├── Makefile                 # Automation commands
├── .gitignore               # Git ignore rules
│
├── Documentation
├── README.md                # Main project documentation
├── DEPLOY.md                # Detailed deployment guide
├── LICENSE                  # MIT license
├── CLAUDE.md                # AI assistant instructions
└── example-post.md          # Example blog post
```

## File Purposes

### Core Worker Files

#### `worker.js`
- **Purpose**: Main production worker
- **Features**: Basic blog functionality
- **When to use**: Standard deployment
- **Size**: ~22KB

#### `worker-enhanced.js`
- **Purpose**: Feature-rich version
- **Features**: RSS feed, sitemap, meta tags, excerpts
- **When to use**: When you need SEO features
- **Size**: ~28KB

#### `worker-optimized.js`
- **Purpose**: Modular development version
- **Imports**: Uses `styles.js` for CSS
- **When to use**: During development
- **Note**: Requires build step for production

#### `styles.js`
- **Purpose**: Shared CSS and layout
- **Exports**: `CSS` constant, `createLayout` function
- **Used by**: worker-optimized.js, build scripts

### CLI Tools

#### `upload-gist.go`
- **Purpose**: Quick file uploads
- **Usage**: `./upload-gist -p -d "Title #tags" file.md`
- **Features**: Public/private, tags, multiple files

#### `gist-manager.go`
- **Purpose**: Advanced gist management
- **Features**: Local cache, search, bulk operations
- **Commands**: sync, list, search, delete, add-file, add-tag

#### `gist-cli.go`
- **Purpose**: Simple operations (deprecated)
- **Note**: Use gist-manager.go instead

#### `gist.sh`
- **Purpose**: Interactive menu interface
- **Features**: Guided workflows, easy for beginners

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
- **Purpose**: Bundle styles into worker
- **Input**: worker-optimized.js + styles.js
- **Output**: worker.js with inlined CSS

## Development Workflow

### 1. Local Development
```bash
# Use modular version
wrangler dev worker-optimized.js

# Or standard version
wrangler dev
```

### 2. Making Changes

**CSS Changes**: Edit `styles.js`
```javascript
// Add new styles to the CSS constant
export const CSS = `
  /* Your styles */
`;
```

**Feature Changes**: Edit appropriate worker file
- Simple changes → `worker.js`
- New features → `worker-enhanced.js`
- Modular dev → `worker-optimized.js`

### 3. Building for Production
```bash
# If using worker-optimized.js
npm run build

# Deploy
npm run deploy
```

## Module Dependencies

```
worker.js
  └── (self-contained)

worker-enhanced.js
  └── styles.js (for CSS import)

worker-optimized.js
  └── styles.js (CSS + createLayout)

build.js
  ├── worker-optimized.js
  └── styles.js

CLI Tools (Go)
  └── (self-contained binaries)
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
showArchive() {
  const gists = await this.getGists();
  const archived = gists.filter(g => g.tags.includes('archive'));
  return this.render('Archive', this.archiveView(archived));
}
```

### 3. New CLI Command
```go
// In gist-manager.go
case "archive":
  if archiveCmd.NArg() < 1 {
    // Handle error
  }
  manager.archiveGist(archiveCmd.Arg(0))
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