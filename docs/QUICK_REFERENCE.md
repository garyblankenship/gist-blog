# Quick Reference Card

## 🚀 Essential Commands

### First Time Setup
```bash
export GITHUB_USER="your-username"
export GITHUB_TOKEN="ghp_your_token"
npm install
wrangler login
```

### Daily Workflow

| Task | Command |
|------|---------|
| **Initialize** | `gist init` |
| **Check Status** | `gist status` |
| **Write Post** | Create `.md` file |
| **Stage Post** | `gist add -p -d "Title #tag1" post.md` |
| **Upload Posts** | `gist push` |
| **View Blog** | Visit https://gary.info |

### Post Management

| Task | Command |
|------|---------|
| **Pull Latest** | `gist pull` |
| **List Posts** | `gist list` |
| **Search Posts** | `gist search "keyword"` |
| **Show Details** | `gist show abc123` |
| **Add Tags** | `gist tag abc123 featured` |
| **Remove Post** | `gist rm abc123` |
| **Toggle Visibility** | `gist toggle abc123` |
| **View Changes** | `gist diff` |
| **Push Changes** | `gist push` |

### Development

| Task | Command |
|------|---------|
| **Local Dev** | `make dev` → http://localhost:8787 |
| **View Logs** | `make tail` |
| **Build Tools** | `make build` |

## 📝 Writing Tips

### Post Format
```markdown
Title Here #tag1 #tag2 #tag3

# Heading

Content with **bold** and *italic* text.

## Code Example
\`\`\`javascript
console.log("Hello!");
\`\`\`

- List item 1
- List item 2

[Link text](https://example.com)
![Image alt](image-url.jpg)
```

### Tag Best Practices
- Use lowercase: `#javascript` not `#JavaScript`
- Be specific: `#nodejs` not just `#node`
- Limit to 3-5 tags per post
- Common tags: `#tutorial`, `#tips`, `#project`, `#update`

## 🔧 Configuration

### Environment Variables
```bash
# Required
export GITHUB_USER="username"
export GITHUB_TOKEN="ghp_token"

# Optional (for private gists)
wrangler secret put GITHUB_TOKEN
```

### Key Files
- `wrangler.toml` - Cloudflare config
- `worker.js` - Main blog code
- `.gist-cache/` - Local gist cache
- `Makefile` - Automation commands

## 🌐 URLs

### Your Blog
- Home: https://gary.info
- RSS: https://gary.info/rss.xml
- Sitemap: https://gary.info/sitemap.xml
- Post: https://gary.info/gist/{id}
- Tag: https://gary.info/tag/{tag}

### Management
- GitHub Gists: https://gist.github.com
- Cloudflare Dashboard: https://dash.cloudflare.com
- Worker Analytics: Workers → gary-info → Analytics

## 🚨 Troubleshooting

### Common Fixes

| Issue | Solution |
|-------|----------|
| **Auth Error** | Check `GITHUB_TOKEN` is set |
| **Deploy Fails** | Run `wrangler login` |
| **No Posts** | Run `make sync` |
| **Cache Stale** | Delete `.gist-cache/` folder |
| **Route Conflict** | Check Cloudflare dashboard |

### Debug Commands
```bash
# Check environment
echo $GITHUB_USER
echo $GITHUB_TOKEN | cut -c1-10

# Test GitHub API
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user

# Clear KV cache
wrangler kv key delete "gists-list" --binding=GIST_CACHE

# View worker logs
wrangler tail --format pretty
```

## 📊 Monitoring

### Check Status
```bash
# API rate limit
curl -s -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/rate_limit | \
     jq '.rate.remaining'

# Worker requests (last hour)
# View in Cloudflare Dashboard → Workers → Analytics
```

### Backup Gists
```bash
# Quick backup
make sync
cp .gist-cache/gists.json backup-$(date +%Y%m%d).json

# Full export
./gist-manager sync
tar -czf gists-backup.tar.gz .gist-cache/
```

## 🎯 Pro Tips

1. **Batch Upload**
   ```bash
   for f in posts/*.md; do
     make upload FILE="$f" DESC="$(basename $f .md)"
   done
   ```

2. **Quick Deploy**
   ```bash
   # Alias for quick deploy
   alias blog-deploy="cd ~/gist-blog && wrangler deploy"
   ```

3. **Auto Tag**
   ```bash
   # Add year tag to all posts
   ./gist-manager list | grep "ID:" | \
     awk '{print $2}' | \
     xargs -I {} ./gist-manager add-tag {} "2024"
   ```

4. **Watch for Changes**
   ```bash
   # Auto-upload on file change (requires fswatch)
   fswatch -o posts/ | xargs -n1 -I{} make upload FILE={}
   ```

---

**Need Help?** 
- Docs: `/docs` folder
- Issues: GitHub Issues
- Logs: `wrangler tail`