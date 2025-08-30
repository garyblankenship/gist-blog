# Project Memory

## TASKS
- [x] Check Cloudflare Worker deployment status - DONE: Deployed to gary.info
- [x] Verify Go CLI tools are properly installed and functional - DONE: CLI installed and working
- [x] Test worker.js functionality locally with `npm run dev` - DONE: Running on localhost:8787
- [x] Fix markdown code block parsing issues - DONE: Headers no longer convert inside code blocks
- [x] Update wrangler dependency to 4.28.1 - DONE: Updated package.json
- [x] Commit code improvements and project memory - DONE: Committed be38f91
- [x] Fix GitHub API pagination to fetch ALL gists - DONE: Now fetches up to 1000 gists
- [ ] Add performance optimizations to worker
- [ ] Test GitHub API integration end-to-end

## REFERENCE
### Key Files & Patterns
- **Cloudflare Worker**: `worker.js` - Main blog engine (1,071 lines)
- **Go CLI Tools**: `cmd/gist/main.go` - Local management commands
- **Package Config**: `package.json` - Node.js/Wrangler deployment setup
- **Wrangler Config**: `wrangler.toml` - Cloudflare Worker settings

### Architecture Notes
- **Dual Architecture**: Cloudflare Worker (runtime) + Go CLI (local tools)
- **Worker Features**: Blog engine, routing, caching, RSS/sitemap generation
- **CLI Features**: Git-style workflow (`gist add`, `gist push`, `gist pull`)
- **GitHub Integration**: Uses GitHub Gists as content source
- **Edge Deployment**: Global CDN with KV caching

### Build Commands
- `npm run dev` - Local worker development server
- `npm run deploy` - Deploy to Cloudflare
- `make build` - Build Go CLI tools
- `wrangler dev` - Test worker locally
- `wrangler deploy` - Deploy worker

### Current State
- ✓ Worker.js deployed and working with improved markdown parsing
- ✓ Go CLI tools installed and functional
- ✓ Local dev server running on localhost:8787
- ✓ Markdown code block styling fixed - headers protected inside code blocks
- ✓ Wrangler CLI updated to 4.28.1 (global), local still 3.114.13
- ✓ KV cache cleared for problematic gist
- ✓ GitHub API pagination fixed - Now fetches ALL gists (up to 1000 with 100 per page)
- ✓ Gist enhancement workflow documented - Complete strategy for content refactoring
- ✓ Content filtering added - Code-only gists without tags/description are excluded
- ✓ H2-only TL;DR principle integrated - All articles must be scannable in 30 seconds
- ✓ Strict tag requirement - ONLY gists with hashtags in description are displayed

### Critical Knowledge: Gist Enhancement Workflow
**Purpose**: Refactor and enhance gist content for years to come

**Quick Steps**:
1. **Enhance**: Use `@agent-content-specialist` with `ARTICLE_ENHANCEMENT_TEMPLATE.md`
2. **Update**: `cd /tmp && gh gist edit <id> filename < enhanced.md` (WORKING METHOD)
3. **Title**: `gh gist edit <id> -d "New Title #tags"`
4. **Clear Cache**: `wrangler kv key delete "gist-<id>" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote`
5. **Verify**: Check https://gary.info/gist/<id>

**Key Documents**:
- `GIST_REFACTORING_STRATEGY.md` - Complete workflow
- `ARTICLE_ENHANCEMENT_TEMPLATE.md` - Skimmable structure rules
- `TEMPLATE_EXAMPLE_NOSTALGIA.md` - Real application example