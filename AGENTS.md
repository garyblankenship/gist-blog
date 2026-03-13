# AGENTS.md

Agent guidance for working in this repository.
This file is optimized for coding agents that need clear commands and conventions.

## Project Snapshot

- Name: `gist-blog`
- Runtime split:
  - Cloudflare Worker app in `worker.js`
  - Go CLI in `cmd/gist/main.go` + `internal/**`
- Primary workflows:
  - Build/deploy worker with Wrangler
  - Build/use CLI for gist management

## Rules File Discovery

I checked for editor/assistant policy files requested by the user:

- Cursor rules directory: `.cursor/rules/` -> not present
- Cursor root rules file: `.cursorrules` -> not present
- Copilot instructions: `.github/copilot-instructions.md` -> not present

If these files are added later, update this AGENTS.md to include their instructions.

## Build / Run / Test Commands

Use these from repository root: `/Users/vampire/www/gist`.

### Setup

- Install JS deps: `npm install`
- Install CLI binary dependencies: `go mod download`

### Build

- Build Go CLI binary: `make build`
- Alternate direct build: `go build -o gist cmd/gist/main.go`
- Build worker artifacts (if used): `npm run build`

### Run (Local)

- Worker dev server: `make dev`
- Same via npm: `npm run dev`
- Run CLI help: `go run ./cmd/gist --help`
- Run built CLI: `./gist --help`

### Deploy / Ops

- Deploy worker: `make deploy` or `npm run deploy`
- Stream worker logs: `make tail` or `npm run tail`

### Tests

- Run all Go tests: `go test ./...`
- Verbose all Go tests: `go test -v ./...`
- Disable test cache: `go test -count=1 ./...`

### Run a Single Test (Important)

- By exact test name in one package:
  - `go test ./internal/service -run '^TestPublishFiles$' -v`
- By regex pattern in one package:
  - `go test ./internal/storage/github -run 'TestClient_.*RateLimit' -v`
- By subtest name:
  - `go test ./internal/service -run 'TestPublishFiles/invalid_path' -v`
- With fresh execution (no cache):
  - `go test ./internal/service -run '^TestPublishFiles$' -count=1 -v`

Current state note: `go test ./...` reports no `_test.go` files yet.
Keep single-test commands as the expected pattern once tests are added.

### Lint / Format / Static Checks

No dedicated lint target is currently defined in `Makefile`.
Use standard Go/JS checks explicitly:

- Format Go: `gofmt -w ./cmd ./internal`
- Vet Go: `go vet ./...`
- Compile check only: `go test ./...` (builds packages even without tests)

No ESLint/Prettier/Biome config is committed for `worker.js` right now.
Preserve existing style manually unless/until a formatter is introduced.

## Code Style Guide

Follow existing code patterns over generic preferences.

### Go Style

- Use `gofmt` formatting (tabs, canonical spacing/import layout).
- Keep packages lowercase and short (`domain`, `service`, `storage`, `commands`).
- Keep exported symbols in `CamelCase`, unexported in `camelCase`.
- Constructor naming pattern: `NewType(...)`.
- Method receiver names are short and consistent (`c`, `s`, `m`, `fs`).
- Prefer small interfaces in `internal/service/interfaces.go`.
- Inject dependencies (repos/filesystem/config) instead of using globals.

### Imports (Go)

- Group order seen in repo:
  1) standard library
  2) third-party packages
  3) internal module imports (`gist/internal/...`)
- Keep import lists gofmt-managed.
- Avoid aliasing imports unless necessary (`tea` alias is used for bubbletea).

### Error Handling (Go)

- Return errors; do not panic for expected failures.
- Wrap errors with context using `%w`:
  - `fmt.Errorf("create gist: %w", err)`
- Use typed domain errors for business cases:
  - `domain.ErrInvalidGistID`, `domain.ErrGistNotFound`, etc.
- CLI/UI boundary prints user-facing messages; service/domain layers return errors.
- For non-critical side effects (cache write/cleanup), log or ignore deliberately.

### Types and Data Modeling (Go)

- Use domain-specific types where present (e.g., `domain.GistID`).
- Keep JSON field names aligned with GitHub API payloads.
- Keep structs cohesive; put shared contracts in interfaces file.
- Use pointers when mutation/identity is needed; values for simple transfer types.

### Naming Conventions

- Be explicit and domain-oriented:
  - Good: `ToggleGistVisibility`, `fetchUserGists`, `cacheKey`
- Boolean names should read naturally:
  - `public`, `showTags`, `hasMore`, `isStale`
- Avoid vague abbreviations except common ones (`ctx`, `err`, `id`).

### JavaScript Worker Style (`worker.js`)

- Use `const` by default; `let` only when reassignment is required.
- Use semicolons and single quotes, matching existing file.
- Keep utility/service classes cohesive (`CacheService`, `GitHubService`, `ResponseFactory`).
- Centralize constants in `CONFIG` and avoid magic numbers.
- Keep route handlers explicit and return `Response` objects via helper factories.
- Sanitize/escape untrusted content before injecting into HTML.

### Security and Config Hygiene

- Never commit secrets/tokens.
- Use Wrangler secrets for worker config:
  - `GITHUB_USER`, `GITHUB_TOKEN`, `SITE_URL`, `SITE_NAME`
- Worker blog rendering should only expose public gists.

---

If repository conventions change, update this file in the same PR.
