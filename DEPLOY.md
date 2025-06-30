# Deployment Guide

Complete guide for deploying Gist Blog to Cloudflare Workers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Custom Domains](#custom-domains)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### Required Accounts

1. **GitHub Account**
   - Personal access token with `gist` scope
   - Create at: https://github.com/settings/tokens/new

2. **Cloudflare Account**
   - Free tier is sufficient
   - Sign up at: https://cloudflare.com

### Local Requirements

```bash
# Check versions
node --version  # v16.0.0 or higher
npm --version   # v7.0.0 or higher
go version      # go1.19 or higher (for CLI tools)

# Install Wrangler CLI globally
npm install -g wrangler
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/gist-blog.git
cd gist-blog
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Set GitHub credentials
export GITHUB_USER="your-github-username"
export GITHUB_TOKEN="ghp_your_token_here"

# Or create .env file (don't commit!)
echo 'GITHUB_USER=your-github-username' > .env
echo 'GITHUB_TOKEN=ghp_your_token_here' >> .env
```

### 4. Authenticate with Cloudflare

```bash
wrangler login
# Opens browser for authentication
```

---

## Configuration

### Update wrangler.toml

Edit `wrangler.toml` with your settings:

```toml
name = "my-gist-blog"  # Your worker name
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
GITHUB_USER = "your-github-username"

# KV namespace will be created automatically
[[kv_namespaces]]
binding = "GIST_CACHE"
id = "will-be-replaced-after-creation"
preview_id = "will-be-replaced-after-creation"
```

### Create KV Namespace

```bash
# Create production namespace
wrangler kv namespace create "GIST_CACHE"

# Example output:
# ✨ Success!
# Add this to wrangler.toml:
# [[kv_namespaces]]
# binding = "GIST_CACHE"
# id = "abc123..."

# Create preview namespace for development
wrangler kv namespace create "GIST_CACHE" --preview

# Update wrangler.toml with both IDs
```

---

## Deployment

### Development Testing

```bash
# Start local development server
npm run dev
# or
wrangler dev

# Visit http://localhost:8787
```

### Production Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
# or
wrangler deploy

# Output:
# ✨ Deployed to https://my-gist-blog.username.workers.dev
```

### Add GitHub Token (Optional)

For private gists, add token as secret:

```bash
wrangler secret put GITHUB_TOKEN
# Paste token when prompted (hidden input)
```

---

## Custom Domains

### Option 1: Subdomain (Recommended)

1. Add to `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "blog.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

2. Create DNS record in Cloudflare:
   - Type: CNAME
   - Name: blog
   - Target: my-gist-blog.username.workers.dev
   - Proxy: ON (orange cloud)

3. Deploy:
   ```bash
   wrangler deploy
   ```

### Option 2: Root Domain

1. Add to `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

2. Deploy:
   ```bash
   wrangler deploy
   ```

### Option 3: Multiple Domains

```toml
[[routes]]
pattern = "blog.domain1.com/*"
zone_name = "domain1.com"

[[routes]]
pattern = "domain2.com/*"
zone_name = "domain2.com"
```

---

## Advanced Configuration

### Enhanced Worker Features

Use `worker-enhanced.js` for additional features:

```toml
main = "worker-enhanced.js"  # RSS, sitemap, better SEO
```

Features included:
- RSS feed at `/rss.xml`
- Sitemap at `/sitemap.xml`
- Enhanced meta tags
- Post excerpts

### Cache Configuration

Modify cache TTL in worker.js:

```javascript
this.CACHE_TTL = 300; // 5 minutes (default)
// Change to:
this.CACHE_TTL = 3600; // 1 hour
```

### Items Per Page

```javascript
this.ITEMS_PER_PAGE = 10; // Default
// Change to:
this.ITEMS_PER_PAGE = 20; // Show more posts
```

---

## Troubleshooting

### Common Issues

#### 1. KV Namespace Errors

```bash
# Error: KV namespace not found
# Solution: Create namespace first
wrangler kv namespace create "GIST_CACHE"
```

#### 2. Route Conflicts

```bash
# Error: Route already assigned to another worker
# Solution: Check existing workers
wrangler route list

# Remove old route if needed (via dashboard)
```

#### 3. Authentication Failed

```bash
# Re-authenticate
wrangler logout
wrangler login
```

#### 4. Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Debugging

#### View Logs

```bash
# Real-time logs
wrangler tail

# Or in separate terminal during dev
wrangler dev --local
```

#### Check Worker Status

```bash
# List deployments
wrangler deployments

# View current deployment
curl https://your-blog.workers.dev
```

#### Test KV Cache

```bash
# List KV keys
wrangler kv key list --binding=GIST_CACHE

# Get specific key
wrangler kv key get "gists-list" --binding=GIST_CACHE

# Clear cache
wrangler kv key delete "gists-list" --binding=GIST_CACHE
```

### Performance Issues

#### GitHub API Rate Limits

Add token to increase limits:
- Without token: 60 requests/hour
- With token: 5,000 requests/hour

#### Cache Optimization

```bash
# Monitor cache hit rate
wrangler tail --format json | grep "cache"

# Increase TTL for better performance
# Edit worker.js: CACHE_TTL = 1800 (30 minutes)
```

---

## Maintenance

### Regular Tasks

#### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update wrangler
npm update wrangler

# Update all dependencies
npm update
```

#### Backup Gists

```bash
# Sync all gists locally
./gist-manager sync

# Backup cache
cp -r .gist-cache .gist-cache.backup

# Export as JSON
cat .gist-cache/gists.json > gists-backup-$(date +%Y%m%d).json
```

#### Monitor Usage

```bash
# Check worker metrics (Cloudflare Dashboard)
# Workers > your-worker > Analytics

# API limits
curl -I -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/rate_limit
```

### Rollback Deployment

```bash
# List previous deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback [version-id]

# Example:
wrangler rollback abc123-def456-789
```

### Clear All Caches

```bash
# Delete all KV entries
for key in $(wrangler kv key list --binding=GIST_CACHE | jq -r '.[].name'); do
  wrangler kv key delete "$key" --binding=GIST_CACHE
done

# Force refresh
curl -X POST https://your-blog.com/refresh-cache
```

---

## Security Best Practices

1. **Never commit tokens**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo "*.token" >> .gitignore
   ```

2. **Use secrets for sensitive data**
   ```bash
   wrangler secret put GITHUB_TOKEN
   wrangler secret put ADMIN_KEY
   ```

3. **Rotate tokens regularly**
   - Create new token on GitHub
   - Update secret: `wrangler secret put GITHUB_TOKEN`
   - Revoke old token

4. **Monitor access logs**
   ```bash
   wrangler tail --format json | grep "status"
   ```

---

## Migration Guide

### From Other Platforms

#### From WordPress/Ghost

1. Export posts as Markdown
2. Create gists for each post
3. Add tags to descriptions
4. Deploy Gist Blog

#### From Static Site Generators

1. Copy markdown files
2. Upload as gists:
   ```bash
   for file in posts/*.md; do
     ./upload-gist -p -d "$(basename $file .md)" "$file"
   done
   ```

### Preserve URLs

Add redirects in worker.js:

```javascript
// Old URL structure redirects
if (path.startsWith('posts/')) {
  const slug = path.replace('posts/', '');
  return Response.redirect(`${url.origin}/gist/${slug}`, 301);
}
```

---

## Next Steps

1. **Create your first post**
   ```bash
   ./upload-gist -p -d "Hello World #first" hello.md
   ```

2. **Customize styling**
   - Edit CSS in `worker.js` or `styles.js`
   - Deploy changes

3. **Set up automation**
   - GitHub Actions for auto-deploy
   - Scheduled gist syncing

4. **Add analytics**
   - Cloudflare Analytics (built-in)
   - Custom tracking pixel

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/gist-blog/issues)
- **Cloudflare Docs**: [workers.cloudflare.com](https://workers.cloudflare.com)
- **Wrangler CLI**: [Wrangler Documentation](https://developers.cloudflare.com/workers/cli-wrangler)