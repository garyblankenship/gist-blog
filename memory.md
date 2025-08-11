# Project Memory

## TASKS
- [x] Check Cloudflare Worker deployment status - DONE: Deployed to gary.info
- [x] Verify Go CLI tools are properly installed and functional - DONE: CLI installed and working
- [x] Test worker.js functionality locally with `npm run dev` - DONE: Running on localhost:8787
- [x] Fix markdown code block parsing issues - DONE: Headers no longer convert inside code blocks
- [ ] Update local wrangler to match global version (3.114.13 vs 4.28.1)
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