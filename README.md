# 📝 Gist Blog

Transform your GitHub Gists into a beautiful, fast blog powered by Cloudflare Workers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)
![Go](https://img.shields.io/badge/Go-1.19+-00ADD8.svg)

## ✨ Features

- **📝 GitHub Gists as Posts** - Write in Gist, publish instantly
- **🏷️ Tag System** - Organize posts with `#hashtags` in descriptions
- **🌙 Dark Mode** - Automatic theme switching based on system preference
- **⚡ Lightning Fast** - Powered by Cloudflare Workers edge network
- **🔍 SEO Optimized** - Meta tags, sitemap.xml, RSS feed included
- **📱 Mobile Responsive** - Beautiful on all devices
- **🗄️ Smart Caching** - KV storage for optimal performance
- **📦 Local Management** - Powerful Go CLI tools for gist operations

## 🚀 Quick Start

### Prerequisites

- GitHub account with [personal access token](https://github.com/settings/tokens)
- Cloudflare account (free tier works)
- Go 1.19+ (for CLI tools)
- Node.js 16+ (for deployment)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/gist-blog.git
cd gist-blog

# Install dependencies
npm install

# Set environment variables
export GITHUB_USER="your-github-username"
export GITHUB_TOKEN="ghp_your_token_here"
```

### 2. Configure Secrets & Deploy

```bash
# Login to Cloudflare
wrangler login

# Set required secrets
wrangler secret put GITHUB_USER
# Enter: your-github-username

wrangler secret put GITHUB_TOKEN
# Enter: ghp_your_token_here

wrangler secret put SITE_URL
# Enter: https://your-domain.com

wrangler secret put SITE_NAME
# Enter: Your Blog Name

# Deploy to Cloudflare
wrangler deploy
```

### 3. Create Your First Post

```bash
# Initialize gist CLI
gist init

# Write a post
echo "# My First Post\n\nHello from Gist Blog!" > post.md

# Stage and upload
gist add -p -d "My First Blog Post #introduction #hello" post.md
gist push
```

Visit your blog at `https://your-domain.com` 🎉

## 📖 Usage Guide

### Writing Posts

Create posts as GitHub Gists with markdown files:

```markdown
# Your Post Title

Write your content in **Markdown** with full support for:

- Lists
- Code blocks
- Images
- Links
- And more!
```

### Git-Style Workflow

Use familiar git-like commands:

```bash
# Pull latest gists from GitHub
gist pull

# Check status
gist status

# Stage new posts
gist add -p -d "Post Title #tag1 #tag2" post.md

# Stage multiple files
gist add file1.md file2.md -d "Multi-file post #code"

# Add tags to existing gist
gist tag <gist-id> featured tutorial

# Remove a gist
gist rm <gist-id>

# Push all changes
gist push

# Search gists
gist search "docker"

# Show gist details
gist show <gist-id>

# View recent posts
gist log
```

### Quick Commands

```bash
make help          # Show all commands
make dev           # Local development
make deploy        # Deploy to production
make build         # Build gist CLI
make install-cli   # Install gist command
make pull          # Pull latest from GitHub
make status        # Show staged changes
make list          # List all posts
make search Q=term # Search posts
```

## 🏗️ Architecture

```
├── Worker (Edge)
│   ├── Routing          # /, /gist/:id, /tag/:tag, /rss.xml
│   ├── GitHub API       # Fetch gists with caching
│   ├── Markdown Parser  # Built-in markdown rendering
│   └── KV Cache         # 5-minute TTL for performance
│
├── CLI Tools (Local)
│   ├── gist             # Git-style unified CLI
│   ├── upload-gist      # Legacy upload tool
│   └── gist-manager     # Legacy management tool
│
└── Features
    ├── RSS Feed         # /rss.xml for readers
    ├── Sitemap          # /sitemap.xml for SEO
    ├── Meta Tags        # Open Graph & Twitter cards
    └── Pagination       # 10 posts per page
```

## 🛠️ Configuration

### wrangler.toml

```toml
name = "your-blog"
main = "worker.js"
compatibility_date = "2024-01-01"

# Optional: KV namespace for caching
[[kv_namespaces]]
binding = "GIST_CACHE"
id = "your-kv-id"

# For custom domain
[[routes]]
pattern = "yourdomain.com/*"
zone_name = "yourdomain.com"
```

**Note**: Secrets (GITHUB_USER, GITHUB_TOKEN, SITE_URL, SITE_NAME) are configured via `wrangler secret` commands, not in wrangler.toml.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_USER` | Your GitHub username | ✅ |
| `GITHUB_TOKEN` | Personal access token | ✅ |
| `SITE_URL` | Your blog URL (e.g., https://blog.example.com) | ✅ |
| `SITE_NAME` | Your blog name | ✅ |
| `GIST_CACHE` | KV namespace binding | ⭕ (recommended) |

## 📱 Features in Detail

### Tag System

Add hashtags to gist descriptions for automatic categorization:

```
"My Docker Tutorial #docker #devops #tutorial"
```

Tags become clickable links: `/tag/docker`

### RSS Feed

Available at `/rss.xml` for feed readers. Includes:
- Latest 20 posts
- Full metadata
- Category tags

### SEO Optimization

- Semantic HTML5 structure
- Meta descriptions from post excerpts
- Open Graph tags for social sharing
- Automatic sitemap generation
- Canonical URLs

### Performance

- Edge deployment (< 50ms latency worldwide)
- KV caching reduces GitHub API calls
- Optimized asset delivery
- Minimal JavaScript (none by default)

## 🔧 Advanced Usage

### Custom Domain

1. Add domain to Cloudflare
2. Update `wrangler.toml`:
   ```toml
   [[routes]]
   pattern = "blog.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```
3. Deploy: `wrangler deploy`

### Private Gists

The GitHub token secret you configured during deployment allows access to private gists. No additional configuration needed.

### Bulk Operations

```bash
# Export all gists
gist pull
cat .gist-cache/gists.json | jq

# Batch tag updates
for id in $(gist list | grep -o '^[a-f0-9]\{7\}'); do
  gist tag "$id" "archived"
done
gist push

# Clean up old posts
gist search "temp" | grep -o '^[a-f0-9]\{7\}' | \
  xargs -I {} gist rm {}
gist push
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Inspired by static site generators
- Powered by GitHub's Gist API

---

**Transform your GitHub gists into a beautiful blog in minutes, not hours.**