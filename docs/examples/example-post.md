# Welcome to Gist Blog!

This is an example post demonstrating the features of your new Gist-powered blog. Upload this file to see it in action:

```bash
./upload-gist -p -d "Welcome to Gist Blog #introduction #tutorial #markdown" example-post.md
```

## Features Showcase

### Markdown Support

Write in **bold**, *italic*, or ***both***! Create `inline code` or code blocks:

```javascript
// Your blog supports syntax highlighting
function greet(name) {
  return `Hello, ${name}! Welcome to Gist Blog.`;
}

console.log(greet('World'));
```

### Lists and Organization

**Ordered List:**
1. Write your post in Markdown
2. Upload as a GitHub Gist
3. View instantly on your blog

**Unordered List:**
- ✅ Zero build process
- ✅ Automatic deployment
- ✅ SEO optimized
- ✅ RSS feed included

### Links and Images

Create [links to anywhere](https://github.com) or embed images:

![Placeholder Image](https://via.placeholder.com/600x300?text=Your+Image+Here)

### Blockquotes

> "The best way to predict the future is to invent it."
> 
> — Alan Kay

### Tables

| Feature | Description | Status |
|---------|-------------|--------|
| Markdown | Full CommonMark support | ✅ |
| Tags | Hashtag categorization | ✅ |
| RSS | Automatic feed generation | ✅ |
| Dark Mode | System preference aware | ✅ |

### Code Examples

**Bash:**
```bash
# Deploy your blog
wrangler deploy

# Upload a new post
make upload FILE=post.md DESC="My Post #tag"
```

**Go:**
```go
// Manage your gists
func main() {
    manager := NewGistManager()
    manager.Sync()
    manager.List()
}
```

### Horizontal Rules

Use three dashes for separators:

---

## Tag System

This post has multiple tags: `#introduction`, `#tutorial`, and `#markdown`. Click any tag to see related posts!

## What's Next?

1. **Customize** - Edit the CSS in `worker.js` to match your style
2. **Write** - Create engaging content in Markdown
3. **Share** - Your RSS feed is at `/rss.xml`
4. **Analyze** - Check Cloudflare Analytics for insights

---

*Happy blogging! 🚀*