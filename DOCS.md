# 📚 Gist Blog Documentation

Welcome to the Gist Blog documentation! This is your starting point for all documentation.

## 🚀 Getting Started

1. **[README.md](README.md)** - Project overview and features
2. **[setup.sh](setup.sh)** - One-command setup script
3. **[example-post.md](example-post.md)** - Example blog post

## 📖 User Guides

### Essential Guides
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Cheat sheet for daily use
- **[Git-Style Guide](docs/GIT_STYLE_GUIDE.md)** - Complete guide to the `gist` CLI
- **[Deployment Guide](DEPLOY.md)** - Detailed deployment instructions

### Reference Documentation
- **[CLI Reference](docs/CLI_REFERENCE.md)** - Complete command reference
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Understanding the codebase

## 🔧 Configuration

- **[wrangler.toml](wrangler.toml)** - Cloudflare Workers configuration
- **[package.json](package.json)** - Node.js dependencies and scripts
- **[Makefile](Makefile)** - Build automation

## ⚠️ Important Notes

- **[DEPRECATED.md](DEPRECATED.md)** - Legacy tools migration guide
- **[CLAUDE.md](CLAUDE.md)** - AI assistant instructions

## 📝 Quick Start Commands

```bash
# One-time setup
./setup.sh

# Daily workflow
gist pull                           # Get latest posts
gist add -p -d "Title #tag" post.md # Stage new post
gist push                           # Upload to GitHub
```

## 🌐 Live Features

Your deployed blog includes:
- Homepage: `https://your-domain.com/`
- RSS Feed: `https://your-domain.com/rss.xml`
- Sitemap: `https://your-domain.com/sitemap.xml`
- Post: `https://your-domain.com/gist/{id}`
- Tag: `https://your-domain.com/tag/{tag}`

## 🤝 Getting Help

1. **Built-in help:** `gist help` or `gist help <command>`
2. **GitHub Issues:** Report bugs or request features
3. **Quick Reference:** Keep [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) handy

## 📊 Architecture Overview

```
Gist Blog
├── Frontend (Cloudflare Workers)
│   ├── Routes handling
│   ├── GitHub API integration
│   ├── Markdown rendering
│   └── KV caching
│
├── CLI (Local Go binary)
│   ├── Git-style commands
│   ├── Staging area
│   ├── Local cache
│   └── Batch operations
│
└── Features
    ├── RSS/Atom feeds
    ├── SEO optimization
    ├── Dark mode support
    └── Mobile responsive
```

## 🚨 Common Tasks

| Task | Command |
|------|---------|
| Setup blog | `./setup.sh` |
| Write post | Create `.md` file |
| Publish post | `gist add -p -d "Title" post.md && gist push` |
| Add tags | `gist tag {id} tag1 tag2` |
| Remove post | `gist rm {id} && gist push` |
| Update blog | `wrangler deploy` |

---

**Happy blogging!** 🎉