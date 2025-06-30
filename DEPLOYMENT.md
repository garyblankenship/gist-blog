# Deployment Guide

This guide shows how to deploy your personal Gist Blog while keeping the public repository clean of credentials.

## Environment-Only Approach

All sensitive data is stored as Cloudflare secrets, never in code. This allows you to:
- Keep the public repo completely clean
- Pull updates from upstream easily
- Never accidentally commit secrets

## Setup Process

### 1. Set Cloudflare Secrets

```bash
# Required secrets
wrangler secret put GITHUB_USER
# Enter your GitHub username

wrangler secret put GITHUB_TOKEN
# Enter your GitHub Personal Access Token

wrangler secret put SITE_URL
# Enter your site URL (e.g., https://gary.info)

wrangler secret put SITE_NAME
# Enter your site name (e.g., gary.info)
```

### 2. Create KV Namespace

```bash
# Create namespace for caching
wrangler kv:namespace create "GIST_CACHE"

# Note the IDs returned - you'll need them for wrangler.toml
```

### 3. Configure Local Deployment

```bash
# Copy the local template
cp wrangler.local.toml wrangler.toml

# Edit wrangler.toml with your actual values:
# - Replace KV namespace IDs
# - Update routes for your domain
# - Customize worker name
```

### 4. Deploy

```bash
# Deploy to Cloudflare
wrangler deploy

# Check deployment
wrangler tail
```

## Maintenance Workflow

### Updating the App

```bash
# Pull latest changes from public repo
git pull upstream main

# Deploy updated code
wrangler deploy
```

### Managing Secrets

```bash
# View current secrets (names only)
wrangler secret list

# Update a secret
wrangler secret put GITHUB_TOKEN

# Delete a secret
wrangler secret delete OLD_SECRET_NAME
```

### Local Development

```bash
# Run locally with secrets
wrangler dev

# Test specific functions
wrangler dev --local
```

## File Structure

```
/your-gist-blog/
├── wrangler.toml          # Public template (safe to commit)
├── wrangler.local.toml    # Your local config (gitignored)
├── worker.js              # Main application code
└── DEPLOYMENT.md          # This file
```

## Security Notes

- ✅ **wrangler.toml** - Safe to commit (no secrets)
- ❌ **wrangler.local.toml** - Contains your IDs (gitignored)
- ❌ **.env** files - Never commit (gitignored)
- ✅ **Cloudflare secrets** - Secure and encrypted

## Troubleshooting

### Common Issues

**"Missing GITHUB_USER"**
```bash
wrangler secret put GITHUB_USER
```

**"KV namespace not found"**
- Check your namespace ID in wrangler.toml
- Verify the namespace exists: `wrangler kv:namespace list`

**"Route not matching"**
- Update routes in wrangler.toml
- Verify DNS is pointing to Cloudflare

### Logs and Debugging

```bash
# View real-time logs
wrangler tail

# Check deployment status
wrangler deployments list

# View environment variables (secrets won't show values)
wrangler secret list
```

## Public Repo Maintenance

The public repository stays clean with placeholder values. To contribute back:

1. Make your changes locally
2. Test thoroughly
3. Replace any personal info with placeholders
4. Submit PR to public repo

This approach lets you maintain your deployment while contributing to the open-source project.