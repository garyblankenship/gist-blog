# Execution Flow Analysis

## Overview

The Gist Blog system follows a dual-architecture execution pattern with separate flows for the Go CLI and Cloudflare Worker applications. Both architectures use dependency injection and repository patterns but operate in different runtime environments.

## CLI Execution Flow

### 1. Application Startup (`cmd/gist/main.go`)

```go
// Phase 1: Environment Setup
_ = storage.LoadEnvFile()              // Load .env if present
fs := storage.NewOSFileSystem()          // Initialize filesystem
cacheDir := filepath.Join(home, ".gist-cache")

// Phase 2: Configuration Loading
config, err := storage.LoadConfig(fs)    // XDG config load
if err != nil {
    if len(os.Args) > 1 && os.Args[1] == "init" {
        handleInit()                    // Special case: setup config
        return
    }
    os.Exit(1)                          // Critical failure
}

// Phase 3: Dependency Injection
githubClient := github.NewClient(config.GitHubToken, config.GitHubUser)
fileCache := cache.NewFileCache(cacheDir, fs)

gistService := service.NewGistService(
    githubClient,  // GistRepository
    fileCache,     // StagingRepository (deprecated)
    fileCache,     // CacheRepository
    fs,           // FileSystem
    config,       // Config
)
```

### 2. Command Routing (`internal/cli/command.go`)

```go
// Command Registration
app := cli.NewApp(gistService)
app.Register(commands.NewPublishCommand(gistService))
app.Register(commands.NewListCommand(gistService))
app.Register(commands.NewSyncCommand(gistService))
app.Register(commands.NewShowCommand(gistService))
app.Register(commands.NewTuiCommand(gistService))

// Command Execution Flow
func (a *App) Run(args []string) {
    cmdName := args[1]                    // Extract command name
    cmdArgs := args[2:]                   // Extract arguments

    // Handle built-in commands
    switch cmdName {
    case "help", "-h", "--help":
        a.showHelp()
        return
    case "version", "-v", "--version":
        fmt.Printf("gist version %s\n", "1.0.0")
        return
    }

    // Resolve aliases and execute
    cmdName = a.resolveAlias(cmdName)
    cmd := a.commands[cmdName]
    ctx := context.Background()
    err := cmd.Execute(ctx, cmdArgs)
}
```

### 3. Service Layer Flow (`internal/service/gist.go`)

The service layer acts as an orchestrator with clear separation of concerns:

```go
// Publish Flow: file validation → gist creation → GitHub API
func (s *GistService) PublishFiles(ctx context.Context, paths []string, description string, public bool) (string, error) {
    // 1. Validate files exist
    for _, path := range paths {
        if !s.fs.Exists(path) {
            return "", domain.ErrFileNotFound{Path: path}
        }
    }

    // 2. Create domain object
    gist := domain.NewGist("", description, public)

    // 3. Add files to gist
    for _, path := range paths {
        content, err := s.fs.ReadFile(path)
        // ... error handling ...
        gist.AddFile(filepath.Base(path), string(content))
    }

    // 4. Persist via repository
    return s.gistRepo.Create(ctx, gist)
}

// List Flow: cache check → GitHub fetch → cache update
func (s *GistService) ListGists(ctx context.Context) ([]domain.Gist, error) {
    // 1. Check cache first
    if !s.cacheRepo.IsStale() {
        if gists, err := s.cacheRepo.GetGists(); err == nil && len(gists) > 0 {
            return gists, nil
        }
    }

    // 2. Fetch from GitHub
    gists, err := s.gistRepo.GetAll(ctx)
    if err != nil {
        return nil, fmt.Errorf("fetch gists: %w", err)
    }

    // 3. Update cache (async-friendly)
    if err := s.cacheRepo.SaveGists(gists); err != nil {
        fmt.Printf("Warning: failed to cache gists: %v\n", err)
    }

    return gists, nil
}
```

## Worker Execution Flow

### 1. Request Handling (`worker.js`)

```javascript
// Worker entry point with dependency injection
export default {
  async fetch(request, env, ctx) {
    const blog = new GistBlog(env.GITHUB_USER, env.GITHUB_TOKEN, env);
    return await blog.handleRequest(request, ctx);
  }
};

// Request routing
async handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    const segments = path ? path.split('/') : [''];

    switch (segments[0]) {
        case '':
        case 'index':
            return await this.showIndex(url);
        case 'gist':
            return await this.showGist(segments[1] || '');
        case 'tag':
            return await this.showTag(segments[1] || '', url);
        case 'rss.xml':
        case 'feed.xml':
            return await this.generateRSS();
        case 'sitemap.xml':
            return await this.generateSitemap();
        default:
            return this.show404();
    }
}
```

### 2. GitHub API Integration Flow

Both architectures use GitHub API but with different patterns:

**CLI Pattern (Sequential)**
```go
// internal/storage/github/client.go
func (c *Client) GetAll(ctx context.Context) ([]domain.Gist, error) {
    url := fmt.Sprintf("%s/gists", c.baseURL)
    resp, err := c.apiRequest(ctx, "GET", url, nil)
    // ... handle response ...
    var gists []domain.Gist
    json.NewDecoder(resp.Body).Decode(&gists)
    return gists, nil
}
```

**Worker Pattern (Cache-First)**
```javascript
// worker.js
async getGists() {
    const cacheKey = 'gists-list';

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from GitHub
    const allGists = await this.githubService.fetchUserGists();

    // Filter and process
    const publicGists = allGists.filter(gist => gist.public === true);
    const processed = publicGists.map(gist => this.processGist(gist))
                                .filter(gist => gist.tags && gist.tags.length > 0);

    // Cache result
    await this.cacheService.put(cacheKey, processed);
    return processed;
}
```

### 3. Cache Interaction Flow

**CLI Cache Flow** (File-based)
```go
// Read from cache
if !s.cacheRepo.IsStale() {
    if gists, err := s.cacheRepo.GetGists(); err == nil && len(gists) > 0 {
        return gists, nil
    }
}

// Write to cache (sync)
if err := s.cacheRepo.SaveGists(gists); err != nil {
    // Log but continue
}
```

**Worker Cache Flow** (KV Storage)
```javascript
// Check cache
const cached = await this.cacheService.get(cacheKey);
if (cached) {
    return cached;
}

// Process and cache
const processed = /* ... */;
await this.cacheService.put(cacheKey, processed);
```

## Error Handling Patterns

### CLI Error Flow
```go
// 1. Validation errors (early return)
if !gistID.Valid() {
    return domain.ErrInvalidGistID{ID: id}
}

// 2. API errors (wrapped with context)
if err := s.gistRepo.Create(ctx, gist); err != nil {
    return fmt.Errorf("create gist: %w", err)
}

// 3. Cache errors (logged but non-blocking)
if err := s.cacheRepo.SaveGists(gists); err != nil {
    fmt.Printf("Warning: failed to cache gists: %v\n", err)
}
```

### Worker Error Flow
```javascript
// 1. Route-level error handling
async handleRequest(request, env, ctx) {
    try {
        // ... routing logic ...
    } catch (error) {
        return this.showError(error.message);
    }
}

// 2. Graceful degradation
async showGist(id) {
    let gist = await this.getGistDetails(id);
    if (!gist) {
        // Fallback to list data
        const gists = await this.getGists();
        gist = gists.find(g => g.id === id);
        if (!gist) {
            return this.show404();
        }
    }
}
```

## Key Differences

| Aspect | CLI Architecture | Worker Architecture |
|--------|------------------|---------------------|
| **Runtime** | Go process with single goroutine | Edge runtime with request isolation |
| **Concurrency** | Sequential (BubbleTea event loop) | Request-based (each request isolated) |
| **Cache Strategy** | File-based with staleness check | KV storage with TTL (300s) |
| **Error Handling** | Early exit with error codes | Graceful degradation with fallbacks |
| **GitHub API** | Full CRUD operations (public + private) | Read-only, public gists only |
| **Purpose** | Content management and synchronization | Content serving and rendering |

## Data Flow Visualization

```
CLI Flow:
User → Command → Service → Repository → GitHub API
                     ↓
                Cache (File System)

Worker Flow:
HTTP Request → GistBlog → GitHubService → GitHub API
               ↓           ↓
          CacheService (KV) → Processed Content → Renderer
```

This dual-architecture design allows for both content management (CLI) and content serving (Worker) while maintaining clean separation of concerns and leveraging their respective runtime environments optimally.