# Deployment Guide for Gist Blog

## 📌 Overview

This guide provides comprehensive instructions for deploying your Gist Blog using Cloudflare Workers while maintaining security and flexibility.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Custom Domains](#custom-domains)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)
9. [Security Best Practices](#security-best-practices)

## Prerequisites

### Required Accounts

1. **GitHub Account**
   - Personal access token with `gist` scope
   - Create at: https://github.com/settings/tokens/new
   - Use minimal permissions: `public_repo` or `gist`

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
# Option 1: Environment Variables
export GITHUB_USER="your-github-username"
export GITHUB_TOKEN="ghp_your_token_here"

# Option 2: .env file (DO NOT COMMIT)
echo 'GITHUB_USER=your-github-username' > .env
echo 'GITHUB_TOKEN=ghp_your_token_here' >> .env
```

### 4. Authenticate with Cloudflare

```bash
wrangler login
# Opens browser for authentication
```

## Configuration

### Update wrangler.toml

Edit `wrangler.toml` with your settings:

```toml
name = "my-gist-blog"  # Your worker name
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
GITHUB_USER = "your-github-username"

# KV namespace will be configured automatically
[[kv_namespaces]]
binding = "GIST_CACHE"
id = "will-be-replaced-after-creation"
preview_id = "will-be-replaced-after-creation"
```

### Create KV Namespace

```bash
# Create production namespace
wrangler kv namespace create "GIST_CACHE"

# Create preview namespace for development
wrangler kv namespace create "GIST_CACHE" --preview

# Update wrangler.toml with both namespace IDs
```

### Add GitHub Token (Optional)

For extended GitHub API access or private gists:

```bash
wrangler secret put GITHUB_TOKEN
# Paste token when prompted (hidden input)
```

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

# Output will show your deployment URL
# Example: https://my-gist-blog.username.workers.dev
```

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

## Advanced Configuration

### Enhanced Worker Features

Use `worker-enhanced.js` for additional features:

```toml
main = "worker-enhanced.js"  # RSS, sitemap, better SEO
```

Features:
- RSS feed at `/rss.xml`
- Sitemap at `/sitemap.xml`
- Enhanced meta tags
- Post excerpts

### Cache and Performance Configuration

```javascript
// Modify in worker.js
this.CACHE_TTL = 300;  // 5 minutes (default)
this.ITEMS_PER_PAGE = 10;  // Posts per page

// Examples of customization:
this.CACHE_TTL = 3600;     // 1 hour cache
this.ITEMS_PER_PAGE = 20;  // 20 posts per page
```

## Troubleshooting

### Common Issues

1. **KV Namespace Errors**
   ```bash
   wrangler kv namespace create "GIST_CACHE"
   ```

2. **Route Conflicts**
   ```bash
   wrangler route list
   # Remove conflicting routes via Cloudflare dashboard
   ```

3. **Authentication Problems**
   ```bash
   wrangler logout
   wrangler login
   ```

### Debugging

```bash
# Real-time logs
wrangler tail

# List deployments
wrangler deployments

# Test worker
curl https://your-blog.workers.dev
```

## Maintenance

### Regular Tasks

```bash
# Check outdated packages
npm outdated

# Update dependencies
npm update wrangler
npm update

# Sync gists (if CLI tool available)
./gist-manager sync

# Backup cache
cp -r .gist-cache .gist-cache.backup
```

### Rollback Deployment

```bash
# List deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback [version-id]
```

## Security Best Practices

1. **Never Commit Secrets**
   ```bash
   echo ".env" >> .gitignore
   echo "*.token" >> .gitignore
   ```

2. **Use Cloudflare Secrets**
   ```bash
   wrangler secret put GITHUB_TOKEN
   wrangler secret put ADMIN_KEY
   ```

3. **Token Management**
   - Create new tokens periodically
   - Update via `wrangler secret put`
   - Revoke old tokens

4. **Monitor Access**
   ```bash
   wrangler tail --format json | grep "status"
   ```

## Next Steps

1. Create first post
2. Customize styling
3. Set up automation
4. Add analytics

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/gist-blog/issues)
- **Cloudflare Docs**: [workers.cloudflare.com](https://workers.cloudflare.com)
- **Wrangler CLI**: [Wrangler Documentation](https://developers.cloudflare.com/workers/cli-wrangler)