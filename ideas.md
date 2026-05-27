# Gist Blog — Ideas & Roadmap

> Generated 2026-03-27 using SCAMPER + Design Thinking (cross-pollination, first principles).
> Scored by **impact × feasibility** (each 1–5).

---

## Top 5 Ideas (Ranked)

### 1. GitHub Webhooks → Instant Cache Invalidation
**Score: 20 (Impact: 5 · Feasibility: 4)**
**Framework: Substitute**

Currently, cache invalidation requires manual `wrangler kv key delete` commands after every edit — a clumsy, forgettable step. Replace polling-based freshness with a GitHub Webhook that fires on gist update events. The worker exposes a `POST /webhook` endpoint that verifies the HMAC signature and immediately deletes the affected KV entries.

**Why it matters:** Turns a multi-step manual process into zero-effort automatic freshness. Edits appear live within seconds instead of 5 minutes (or never, if the manual step is skipped).

**Effort:** Medium — add webhook route to worker, register webhook on GitHub, add HMAC verification, configure `WEBHOOK_SECRET` via `wrangler secret`.

**Next step:** Add `POST /webhook` handler in `worker.js` that calls `cacheService.invalidateGist(id)` after signature verification.

---

### 2. Full-Text Search via `/search` + `/index.json`
**Score: 20 (Impact: 5 · Feasibility: 4)**
**Framework: Modify**

The blog has no search. Add a `/index.json` endpoint to the worker that returns a lightweight JSON array of `{id, title, tags, excerpt}` for all posts. A `/search?q=` route serves an HTML page that fetches this index client-side and filters in-browser — no external service, no Algolia, no build step.

**Why it matters:** Readers cannot find older posts. This is the single biggest missing reader feature.

**Effort:** Medium — two new routes in `worker.js`, a small `<script>` block on the search page. Index builds from the existing `fetchUserGists()` call.

**Next step:** Add `GET /index.json` route that returns gist metadata array; add `GET /search` route rendering the search UI with a client-side filter script.

---

### 3. Draft Workflow via Private Gist + `#published` Tag
**Score: 20 (Impact: 4 · Feasibility: 5)**
**Framework: Adapt (Git branch model)**

Writers need to draft before publishing. Use GitHub's built-in private gist visibility as the "draft" state. When a `#published` tag is added to a private gist's description and the gist is set public, the CLI `gist promote [id]` command handles both operations atomically. The worker already filters to public-only — no worker changes needed.

**Why it matters:** Adds a first-class draft → publish workflow without any new infrastructure. Mirrors how developers think about branch → merge.

**Effort:** Low — add `gist promote [id]` to the CLI that calls the GitHub API to set `public: true` and (optionally) swap `#draft` for `#published` in the description.

**Next step:** Add `commands/promote.go` using the existing `GistService` interface; add `PATCH /gists/{id}` call to the GitHub client.

---

### 4. Bundle Markdown Parser — Eliminate CDN Import
**Score: 16 (Impact: 4 · Feasibility: 4)**
**Framework: Eliminate**

`worker.js` lazily imports `marked@15` from `cdn.jsdelivr.net` on every cold start. This introduces a network dependency that can fail, adds latency, and pins behavior to an external version. The existing `build.js` script should bundle a chosen parser (e.g., `micromark` or `marked` vendored locally) into the worker at deploy time.

**Why it matters:** Eliminates a single-point-of-failure dependency and reduces cold-start latency. The blog becomes fully self-contained.

**Effort:** Medium — update `build.js` to bundle the parser; remove the `import()` call; adjust `initMarked()`. Worker size stays under the 1MB limit with tree-shaking.

**Next step:** Add `marked` to `devDependencies` in `package.json`; update `build.js` to produce a bundled `worker.dist.js`; update `wrangler.toml` `main` entry.

---

### 5. `gist edit [id]` — Open in `$EDITOR`, Push on Save
**Score: 16 (Impact: 4 · Feasibility: 4)**
**Framework: Combine (adapt Git's `git commit -v`)**

There is no `gist edit` command. Updating a post requires `gh gist edit` (external tool) or manually editing and re-uploading. Add `gist edit [id]` that: fetches the gist content to a temp file, opens `$EDITOR`, watches for save+close, then pushes the updated content via the GitHub API and invalidates the KV cache.

**Why it matters:** Makes editing feel native and fast — no context switching to `gh` CLI or the GitHub web UI.

**Effort:** Low-Medium — add `commands/edit.go`; reuse `GistService`; use `os.CreateTemp`, `exec.Command($EDITOR, tmpFile)`, then `cmd.Wait()`. Trigger cache invalidation after push.

**Next step:** Add `edit` command scaffolding in `internal/cli/commands/edit.go`.

---

## All 30 Ideas

### Substitute

| # | Idea | Score |
|---|------|-------|
| S1 | Bundle markdown parser at deploy time (remove CDN import) | 16 |
| S2 | Replace KV cache with Durable Objects for per-post stateful features (reactions, view counts) | 9 |
| S3 | Replace tag-only taxonomy with frontmatter-in-description (`title:`, `series:`, `slug:`) | 12 |
| S4 | **[TOP 1]** GitHub Webhooks → instant cache invalidation on gist update | 20 |

### Combine

| # | Idea | Score |
|---|------|-------|
| C1 | RSS feed + email delivery: `/subscribe` endpoint → Cloudflare Queue → Resend/Mailgun | 15 |
| C2 | `gist tui` post-publish: auto-copy live URL to clipboard | 10 |
| C3 | `/.well-known/feeds` discovery endpoint (WebSub hub hint) combining RSS + sitemap | 8 |
| C4 | **[TOP 5]** `gist edit [id]` opens `$EDITOR`, pushes on save, invalidates cache | 16 |

### Adapt

| # | Idea | Score |
|---|------|-------|
| A1 | **[TOP 3]** Draft workflow: private gist + `#published` tag → `gist promote [id]` | 20 |
| A2 | Obsidian-style `[[wikilinks]]` rendered as inter-post hyperlinks in worker | 12 |
| A3 | `gist version [id]` surfaces GitHub gist revision history at `/gist/{id}/history` | 12 |
| A4 | Reading time estimate (`~4 min read`) computed server-side from word count | 15 |

### Modify

| # | Idea | Score |
|---|------|-------|
| M1 | Dark mode toggle button persisted via `localStorage` (CSS vars already support it) | 15 |
| M2 | HTMX-powered infinite scroll: `/partial/page/{n}` route returning post-list HTML fragment | 12 |
| M3 | **[TOP 2]** Full-text search: `/search?q=` + `/index.json` static index, client-side filtering | 20 |
| M4 | `gist publish` accepts stdin (`echo "..." \| gist publish -d "Title #tag"`) | 10 |

### Put to Other Uses

| # | Idea | Score |
|---|------|-------|
| P1 | `#docs` tag renders ordered sidebar nav — turns blog into a lightweight docs site | 12 |
| P2 | KV-backed link shortener: `/go/{slug}` → arbitrary URL, managed via CLI | 12 |
| P3 | `#portfolio` tag renders posts in a visual card/grid layout instead of list | 10 |
| P4 | GitHub Gists star count as a "popular posts" sort option | 8 |

### Eliminate

| # | Idea | Score |
|---|------|-------|
| E1 | **[TOP 4]** Bundle markdown parser — eliminate CDN dependency entirely | 16 |
| E2 | HMAC-signed `?invalidate=<token>` query param for on-demand cache flush (no wrangler CLI needed) | 15 |
| E3 | `gist doctor` command: validates config, token scopes, network — colored diagnostics | 15 |

### Reverse

| # | Idea | Score |
|---|------|-------|
| R1 | `gist import [url]` pulls any markdown URL (Dev.to, HackMD, Substack) into a new gist | 12 |
| R2 | `gist render [id]` fetches + renders post to terminal via glamour (offline reading) | 12 |
| R3 | `/preview/{id}?token={secret}` serves private gists via shared preview link | 12 |

### Cross-Pollination (Adjacent Domains)

| # | Idea | Score |
|---|------|-------|
| X1 | JSON Feed endpoint (`/feed.json`) — preferred by modern feed readers over RSS | 12 |
| X2 | `gist deploy` CLI command wraps `wrangler deploy` — first-class deploy action | 10 |
| X3 | Open Graph social preview image for code-heavy posts using Cloudflare Image Generation | 9 |
| X4 | `#pinned` tag renders a sticky "About" banner at the top of the index page | 8 |

---

## Scoring Methodology

**Score = Impact (1–5) × Feasibility (1–5)**

- **Impact**: How much does this improve the experience for writers or readers?
- **Feasibility**: How much existing infrastructure can be reused? How few moving parts?

Ties broken by user-facing value (reader experience > writer experience > ops experience).
