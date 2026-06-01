# Gist Blog

Cloudflare Worker blog backed by public GitHub Gists, plus a Go CLI for creating and managing gists.

## Requirements

- GitHub account and personal access token with `gist` scope
- Cloudflare account
- Go 1.23+; this module declares toolchain Go 1.24.4
- Node.js 16+

## Setup

```bash
make setup
make doctor
```

Create your local Worker config:

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` for your Worker name, KV namespace, and route.

## Worker deploy

```bash
npx wrangler login
npx wrangler secret put GITHUB_USER
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put SITE_URL
npx wrangler secret put SITE_NAME
make deploy
```

Secrets are stored in Cloudflare, not in `wrangler.toml`.

## CLI setup

```bash
make install-cli
gist init
```

The CLI reads `GITHUB_USER` and `GITHUB_TOKEN` from the environment first, then falls back to the local config written by `gist init`.

## Common commands

```bash
make help          # Show project commands
make dev           # Run Worker locally
make deploy        # Deploy Worker
make verify        # Run tests, vet, build, and CLI smoke checks
make install-cli   # Build and install gist CLI

gist publish -p -d "Post Title #tag" post.md
gist list
gist show <gist-id>
gist sync
gist tui
```

## Writing posts

Each public gist is a blog post. Tags come from hashtags in the gist description:

```bash
gist publish -p -d "My First Post #intro #notes" post.md
```

Only public gists are displayed by the Worker.

## Configuration files

- `wrangler.toml.example`: template for local Worker configuration
- `wrangler.toml`: local deployment config; ignored by git
- `.env.example`: local environment variable example
- `.gistconfig`: local CLI config written by `gist init`; ignored by git

## Project layout

```text
worker.js              Cloudflare Worker app
cmd/gist/main.go       Go CLI entry point
internal/cli           CLI commands
internal/domain        Domain types and errors
internal/service       Gist service logic
internal/storage       Config, cache, filesystem, and GitHub client
```

## Verify

```bash
make verify
```
