

export default {
  async fetch(request, env, ctx) {
    const blog = new GistBlog(env.GITHUB_USER, env.GITHUB_TOKEN, env);
    return await blog.handleRequest(request, ctx);
  }
};

class GistBlog {
  constructor(githubUser, githubToken, env) {
    this.githubUser = githubUser;
    this.githubToken = githubToken;
    this.env = env;
    this.CACHE_TTL = 300; // 5 minutes
    this.ITEMS_PER_PAGE = 10;
    this.siteUrl = env.SITE_URL || 'https://your-domain.com';
    this.siteName = env.SITE_NAME || 'Your Gist Blog';
  }

  async handleRequest(request, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname.slice(1);
      const segments = path ? path.split('/') : [''];

      // Handle special routes
      if (path === 'rss.xml' || path === 'feed.xml') {
        return await this.generateRSS();
      }
      if (path === 'sitemap.xml') {
        return await this.generateSitemap();
      }

      switch (segments[0]) {
        case '':
        case 'index':
          return await this.showIndex(url);
        case 'gist':
          return await this.showGist(segments[1] || '');
        case 'tag':
          return await this.showTag(segments[1] || '', url);
        default:
          return this.show404();
      }
    } catch (error) {
      return this.showError(error.message);
    }
  }

  async getGists() {
    const cacheKey = 'gists-list';
    
    // Check KV cache if available
    if (this.env.GIST_CACHE) {
      const cached = await this.env.GIST_CACHE.get(cacheKey, 'json');
      if (cached && cached.timestamp > Date.now() - this.CACHE_TTL * 1000) {
        return cached.data;
      }
    }

    // Fetch from GitHub with pagination
    const headers = {
      'User-Agent': 'Cloudflare-Worker-Gist-Blog',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    let allGists = [];
    let page = 1;
    let hasMore = true;

    // Fetch all pages (GitHub API returns 30 per page by default, we'll use 100)
    while (hasMore) {
      const response = await fetch(`https://api.github.com/users/${this.githubUser}/gists?per_page=100&page=${page}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gists from GitHub. Check your username and token.');
      }

      const gists = await response.json();
      
      if (gists.length === 0) {
        hasMore = false;
      } else {
        allGists = allGists.concat(gists);
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 10) {
          hasMore = false;
        }
      }
    }
    
    // Filter to only show public gists on the blog
    const publicGists = allGists.filter(gist => gist.public === true);
    
    const processed = publicGists.map(gist => this.processGist(gist))
                                  .filter(gist => {
                                    // Filter out gists without proper blog content
                                    // MUST have tags (hashtags in description) to be included as a blog post
                                    const hasTags = gist.tags && gist.tags.length > 0;
                                    
                                    // Only include gists that have at least one tag
                                    // This ensures only intentionally published blog posts appear
                                    return hasTags;
                                  });

    // Sort by created date (newest first)
    processed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Cache in KV if available
    if (this.env.GIST_CACHE) {
      await this.env.GIST_CACHE.put(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: processed
      }), {
        expirationTtl: this.CACHE_TTL
      });
    }

    return processed;
  }

  processGist(gist) {
    const description = gist.description || '';
    const tags = [];
    
    // Extract tags and clean description
    const cleanDesc = description.replace(/#(\w+)/g, (match, tag) => {
      tags.push(tag);
      return '';
    });

    // Get first file content
    let content = '';
    let filename = '';
    let excerpt = '';
    for (const [name, file] of Object.entries(gist.files || {})) {
      content = file.content || '';
      filename = name;
      
      // Generate excerpt (first 200 chars of content)
      excerpt = content.replace(/^#.*$/gm, '')  // Remove markdown headers
                      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                      .replace(/\n+/g, ' ')           // Replace newlines with spaces
                      .trim()
                      .substring(0, 200);
      if (excerpt.length === 200) excerpt += '...';
      break;
    }

    return {
      id: gist.id,
      description: cleanDesc.trim() || 'Untitled',
      tags,
      content,
      filename,
      excerpt,
      created_at: gist.created_at,
      updated_at: gist.updated_at,
      url: gist.html_url
    };
  }

  async getGistDetails(id) {
    const cacheKey = `gist-${id}`;
    
    // Check KV cache if available
    if (this.env.GIST_CACHE) {
      const cached = await this.env.GIST_CACHE.get(cacheKey, 'json');
      if (cached && cached.timestamp > Date.now() - this.CACHE_TTL * 1000) {
        return cached.data;
      }
    }

    const headers = {
      'User-Agent': 'Cloudflare-Worker-Gist-Blog',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    const response = await fetch(`https://api.github.com/gists/${id}`, {
      headers
    });

    if (!response.ok) {
      return null;
    }

    const gist = await response.json();
    
    // Only show public gists
    if (gist.public !== true) {
      return null;
    }
    
    const processed = this.processGist(gist);

    // Cache in KV if available
    if (this.env.GIST_CACHE) {
      await this.env.GIST_CACHE.put(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: processed
      }), {
        expirationTtl: this.CACHE_TTL
      });
    }

    return processed;
  }

  getAllTags(gists) {
    const tags = [];
    for (const gist of gists) {
      tags.push(...gist.tags);
    }
    
    const tagCounts = {};
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  }

  paginate(items, page) {
    const total = items.length;
    const totalPages = Math.ceil(total / this.ITEMS_PER_PAGE);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const offset = (currentPage - 1) * this.ITEMS_PER_PAGE;
    
    return {
      items: items.slice(offset, offset + this.ITEMS_PER_PAGE),
      current_page: currentPage,
      total_pages: totalPages,
      total_items: total,
      has_prev: currentPage > 1,
      has_next: currentPage < totalPages
    };
  }

  async showIndex(url) {
    const gists = await this.getGists();
    const tags = this.getAllTags(gists);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pagination = this.paginate(gists, page);

    const html = this.render(
      this.siteName,
      this.indexView(pagination.items, tags, pagination),
      {
        description: 'Personal blog powered by GitHub Gists',
        canonicalUrl: this.siteUrl
      }
    );
    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  async showGist(id) {
    if (!id) {
      return this.show404();
    }

    let gist = await this.getGistDetails(id);
    
    if (!gist) {
      // Fallback to list data if detail fetch fails
      const gists = await this.getGists();
      gist = gists.find(g => g.id === id);
      
      if (!gist) {
        return this.show404();
      }
    }

    const html = this.render(
      `${gist.description} - ${this.siteName}`,
      this.gistView(gist),
      {
        description: gist.excerpt,
        canonicalUrl: `${this.siteUrl}/gist/${gist.id}`,
        ogType: 'article',
        publishedTime: gist.created_at,
        modifiedTime: gist.updated_at,
        tags: gist.tags
      }
    );
    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  async showTag(tag, url) {
    if (!tag) {
      return this.show404();
    }

    const allGists = await this.getGists();
    const gists = allGists.filter(g => g.tags.includes(tag));
    const page = parseInt(url.searchParams.get('page') || '1');
    const pagination = this.paginate(gists, page);

    const html = this.render(
      `Posts tagged #${tag} - ${this.siteName}`,
      this.tagView(tag, pagination.items, pagination),
      {
        description: `All posts tagged with #${tag}`,
        canonicalUrl: `${this.siteUrl}/tag/${tag}`
      }
    );
    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  async generateRSS() {
    const gists = await this.getGists();
    const latestGists = gists.slice(0, 20); // Latest 20 posts
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.siteName}</title>
    <link>${this.siteUrl}</link>
    <description>Personal blog powered by GitHub Gists</description>
    <atom:link href="${this.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${latestGists.map(gist => `
    <item>
      <title>${this.h(gist.description)}</title>
      <link>${this.siteUrl}/gist/${gist.id}</link>
      <guid isPermaLink="true">${this.siteUrl}/gist/${gist.id}</guid>
      <description><![CDATA[${this.h(gist.excerpt)}]]></description>
      <pubDate>${new Date(gist.created_at).toUTCString()}</pubDate>
      ${gist.tags.map(tag => `<category>${this.h(tag)}</category>`).join('\n      ')}
    </item>`).join('')}
  </channel>
</rss>`;
    
    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml;charset=UTF-8',
        'Cache-Control': 'max-age=3600'
      }
    });
  }

  async generateSitemap() {
    const gists = await this.getGists();
    const tags = this.getAllTags(gists);
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.siteUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${gists.map(gist => `
  <url>
    <loc>${this.siteUrl}/gist/${gist.id}</loc>
    <lastmod>${new Date(gist.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${tags.map(tag => `
  <url>
    <loc>${this.siteUrl}/tag/${encodeURIComponent(tag)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;
    
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8',
        'Cache-Control': 'max-age=3600'
      }
    });
  }

  show404() {
    const html = this.render('404 - Not Found', this.notFoundView());
    return new Response(html, {
      status: 404,
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  showError(message) {
    const html = this.render('Error', this.errorView(message));
    return new Response(html, {
      status: 500,
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  // View methods
  indexView(gists, tags, pagination) {
    return `
      <div class="tags">
        <span>Tags:</span>
        ${tags.map(tag => `
          <a href="/tag/${encodeURIComponent(tag)}" class="tag">#${this.h(tag)}</a>
        `).join('')}
      </div>

      ${gists.map(gist => `
        <article class="gist-item">
          <h2 class="gist-title">
            <a href="/gist/${encodeURIComponent(gist.id)}">
              ${this.h(gist.description)}
            </a>
          </h2>
          <div class="gist-meta">
            ${this.formatDate(gist.created_at)}
            ${gist.tags.length ? `
              • ${gist.tags.map(tag => `
                <a href="/tag/${encodeURIComponent(tag)}" class="tag-inline">#${this.h(tag)}</a>
              `).join('')}
            ` : ''}
          </div>
          ${gist.excerpt ? `
            <p class="gist-excerpt">${this.h(gist.excerpt)}</p>
          ` : ''}
        </article>
      `).join('')}
      
      ${pagination.total_pages > 1 ? `
        <nav class="pagination">
          ${pagination.has_prev ? `
            <a href="/?page=${pagination.current_page - 1}" class="pagination-prev">← Previous</a>
          ` : ''}
          
          <span class="pagination-info">
            Page ${pagination.current_page} of ${pagination.total_pages}
          </span>
          
          ${pagination.has_next ? `
            <a href="/?page=${pagination.current_page + 1}" class="pagination-next">Next →</a>
          ` : ''}
        </nav>
      ` : ''}
    `;
  }

  gistView(gist) {
    const isMarkdown = gist.filename && (
      gist.filename.toLowerCase().endsWith('.md') || 
      gist.filename.toLowerCase().endsWith('.markdown')
    );

    return `
      <nav class="breadcrumb">
        <a href="/">← All posts</a>
      </nav>

      <article class="gist-single">
        <header>
          <h1>${this.h(gist.description)}</h1>
          <div class="gist-meta">
            <time datetime="${gist.created_at}">
              Created: ${this.formatDate(gist.created_at)}
            </time>
            •
            <time datetime="${gist.updated_at}">
              Updated: ${this.formatDate(gist.updated_at)}
            </time>
            ${gist.tags.length ? `
              <div class="tags-inline">
                ${gist.tags.map(tag => `
                  <a href="/tag/${encodeURIComponent(tag)}" class="tag-inline">#${this.h(tag)}</a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </header>

        <div class="gist-content">
          ${gist.filename ? `
            <div class="filename">${this.h(gist.filename)}</div>
          ` : ''}
          ${isMarkdown ? `
            <div class="markdown-content">
              ${this.parseMarkdown(gist.content)}
            </div>
          ` : `
            <pre><code>${this.h(gist.content)}</code></pre>
          `}
        </div>

      </article>
    `;
  }

  tagView(tag, gists, pagination) {
    return `
      <nav class="breadcrumb">
        <a href="/">← All posts</a>
      </nav>

      <h2>Posts tagged with #${this.h(tag)}</h2>

      ${gists.length === 0 ? `
        <p class="empty-state">No posts found with this tag.</p>
      ` : `
        ${gists.map(gist => `
          <article class="gist-item">
            <h3 class="gist-title">
              <a href="/gist/${encodeURIComponent(gist.id)}">
                ${this.h(gist.description)}
              </a>
            </h3>
            <div class="gist-meta">
              ${this.formatDate(gist.created_at)}
            </div>
            ${gist.excerpt ? `
              <p class="gist-excerpt">${this.h(gist.excerpt)}</p>
            ` : ''}
          </article>
        `).join('')}
        
        ${pagination.total_pages > 1 ? `
          <nav class="pagination">
            ${pagination.has_prev ? `
              <a href="/tag/${encodeURIComponent(tag)}?page=${pagination.current_page - 1}" class="pagination-prev">← Previous</a>
            ` : ''}
            
            <span class="pagination-info">
              Page ${pagination.current_page} of ${pagination.total_pages}
            </span>
            
            ${pagination.has_next ? `
              <a href="/tag/${encodeURIComponent(tag)}?page=${pagination.current_page + 1}" class="pagination-next">Next →</a>
            ` : ''}
          </nav>
        ` : ''}
      `}
    `;
  }

  notFoundView() {
    return `
      <div class="error-page">
        <h2>404 - Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Return to homepage</a></p>
      </div>
    `;
  }

  errorView(message) {
    return `
      <div class="error-page">
        <h2>Error</h2>
        <p>${this.h(message)}</p>
        <p><a href="/">Return to homepage</a></p>
      </div>
    `;
  }

  render(title, content, meta = {}) {
    const {
      description = 'Personal blog powered by GitHub Gists',
      canonicalUrl = this.siteUrl,
      ogType = 'website',
      publishedTime = null,
      modifiedTime = null,
      tags = []
    } = meta;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.h(title)}</title>
    <meta name="description" content="${this.h(description)}">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${ogType}">
    <meta property="og:title" content="${this.h(title)}">
    <meta property="og:description" content="${this.h(description)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="${this.siteName}">
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ''}
    ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}">` : ''}
    ${tags.map(tag => `<meta property="article:tag" content="${this.h(tag)}">`).join('\n    ')}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${this.h(title)}">
    <meta name="twitter:description" content="${this.h(description)}">
    
    <!-- RSS -->
    <link rel="alternate" type="application/rss+xml" title="${this.siteName} RSS Feed" href="/rss.xml">
    
    <style>
:root {
    --primary: #0066cc;
    --primary-hover: #0052a3;
    --bg: #ffffff;
    --bg-secondary: #f8f9fa;
    --text: #1a1a1a;
    --text-muted: #666;
    --border: #e1e4e8;
    --radius: 6px;
}

@media (prefers-color-scheme: dark) {
    :root {
        --primary: #58a6ff;
        --primary-hover: #79b8ff;
        --bg: #0d1117;
        --bg-secondary: #161b22;
        --text: #c9d1d9;
        --text-muted: #8b949e;
        --border: #30363d;
    }
}

* { box-sizing: border-box; }

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text);
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--bg);
}

a { color: var(--primary); text-decoration: none; }
a:hover { color: var(--primary-hover); }

h1, h2, h3 { line-height: 1.2; }

header { margin-bottom: 3rem; }

.site-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
}

.tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    margin: 2rem 0;
}

.tag {
    background: var(--primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    transition: transform 0.1s;
}

.tag:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

.tag-inline {
    color: var(--primary);
    margin-right: 0.5rem;
}

.gist-item {
    background: var(--bg-secondary);
    padding: 1.5rem;
    margin-bottom: 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

.gist-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
}

.gist-meta {
    color: var(--text-muted);
    font-size: 0.875rem;
}

.gist-content {
    margin: 2rem 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

.filename {
    padding: 0.5rem 1rem;
    background: var(--border);
    font-family: monospace;
    font-size: 0.875rem;
}

pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
}

code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
}

/* Markdown styles */
.markdown-content {
    padding: 2rem;
    line-height: 1.7;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
    margin: 1.5rem 0 1rem 0;
    line-height: 1.3;
}

.markdown-content h1:first-child,
.markdown-content h2:first-child {
    margin-top: 0;
}

.markdown-content h1 { font-size: 2rem; }
.markdown-content h2 { font-size: 1.5rem; }
.markdown-content h3 { font-size: 1.25rem; }
.markdown-content h4 { font-size: 1.1rem; }
.markdown-content h5 { font-size: 1rem; }
.markdown-content h6 { font-size: 0.875rem; }

.markdown-content p {
    margin: 1rem 0;
}

.markdown-content pre {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
}

.markdown-content code {
    background: var(--bg);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.875rem;
}

.markdown-content pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
}
/* Language-specific syntax highlighting */
.markdown-content pre {
    position: relative;
}
.markdown-content code.language-python::before,
.markdown-content code.language-javascript::before,
.markdown-content code.language-go::before,
.markdown-content code.language-bash::before {
    content: attr(class);
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg);
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    text-transform: uppercase;
    font-family: system-ui, -apple-system, sans-serif;
}
.markdown-content code.language-python::before { content: 'Python'; }
.markdown-content code.language-javascript::before { content: 'JavaScript'; }
.markdown-content code.language-go::before { content: 'Go'; }
.markdown-content code.language-bash::before { content: 'Bash'; }

.markdown-content blockquote {
    border-left: 4px solid var(--primary);
    margin: 1rem 0;
    padding: 0.5rem 0 0.5rem 1.5rem;
    color: var(--text-muted);
}

.markdown-content ul,
.markdown-content ol {
    margin: 1rem 0;
    padding-left: 2rem;
}

.markdown-content li {
    margin: 0.5rem 0;
}

.markdown-content hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2rem 0;
}

.markdown-content img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius);
    margin: 1rem 0;
}

.markdown-content a {
    color: var(--primary);
    text-decoration: underline;
}

.markdown-content a:hover {
    color: var(--primary-hover);
}

.markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
}

.markdown-content th,
.markdown-content td {
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    text-align: left;
}

.markdown-content th {
    background: var(--bg-secondary);
    font-weight: bold;
}

.breadcrumb {
    margin-bottom: 2rem;
}

.gist-footer {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
}

.error-page {
    text-align: center;
    padding: 4rem 0;
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 3rem 0;
}

/* Pagination styles */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
}

.pagination-prev,
.pagination-next {
    padding: 0.5rem 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: all 0.2s ease;
}

.pagination-prev:hover,
.pagination-next:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.pagination-info {
    color: var(--text-muted);
    font-size: 0.875rem;
}

@media (max-width: 600px) {
    .pagination {
        gap: 1rem;
        font-size: 0.875rem;
    }
    
    .pagination-prev,
    .pagination-next {
        padding: 0.4rem 0.8rem;
    }
}

/* Additional styles for enhanced features */
.site-nav {
    margin-top: 1rem;
    font-size: 0.875rem;
}

.site-nav a {
    margin-right: 1rem;
    color: var(--text-muted);
}

.site-nav a:hover {
    color: var(--primary);
}

.site-footer {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
}

.site-footer a {
    color: var(--primary);
}

.site-tagline {
    margin: -0.5rem 0 1rem 0;
    color: var(--text-muted);
    font-style: italic;
    font-size: 1.1rem;
}

.gist-excerpt {
    color: var(--text-muted);
    margin-top: 0.5rem;
    line-height: 1.5;
}
</style>
</head>
<body>
    <header>
        <h1 class="site-title">
            <a href="/" style="color: inherit;">${this.siteName}</a>
        </h1>
        <p class="site-tagline">here be dragons</p>
        <nav class="site-nav">
            <a href="/rss.xml" title="RSS Feed">RSS</a>
        </nav>
    </header>

    <main>
        ${content}
    </main>
    
    <footer class="site-footer">
        <p>Powered by <a href="https://github.com/garyblankenship/gist-blog">Gist Blog</a> • <a href="/sitemap.xml">Sitemap</a></p>
    </footer>
</body>
</html>`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  h(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  parseMarkdown(text) {
    // First, extract and protect code blocks
    const codeBlocks = [];
    let html = text;
    
    // Extract code blocks and replace with placeholders
    html = html.replace(/```(\w+)?\n?(.*?)```/gs, (match, language, code) => {
      const placeholder = `###CODEBLOCK${codeBlocks.length}###`;
      const lang = language ? language.toLowerCase() : '';
      const langClass = lang ? ` class="language-${lang}"` : '';
      codeBlocks.push(`<pre><code${langClass}>${this.h(code.trim())}</code></pre>`);
      return placeholder;
    });
    
    // Extract inline code and protect it
    const inlineCode = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `###INLINECODE${inlineCode.length}###`;
      inlineCode.push(`<code>${this.h(code)}</code>`);
      return placeholder;
    });
    
    // Now escape HTML for the rest of the content
    html = this.h(html);
    
    // Headers
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    
    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // Lists (simple implementation)
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li>.*<\/li>\s*)+/s, '<ul>$&</ul>');
    
    // Paragraphs
    const lines = html.split('\n');
    const result = [];
    let paragraph = [];
    let inBlock = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check if line is a block element
      if (/^<(h[1-6]|pre|blockquote|ul|ol|hr|li)/.test(trimmed) || 
          /<\/(h[1-6]|pre|blockquote|ul|ol)>$/.test(trimmed)) {
        // Close any open paragraph
        if (paragraph.length) {
          result.push('<p>' + paragraph.join('\n') + '</p>');
          paragraph = [];
        }
        result.push(line);
        inBlock = /<(pre|blockquote|ul|ol)/.test(line) && !/<\/(pre|blockquote|ul|ol)>/.test(line);
      } else if (trimmed === '') {
        // Empty line - close paragraph
        if (paragraph.length) {
          result.push('<p>' + paragraph.join('\n') + '</p>');
          paragraph = [];
        }
      } else {
        // Regular text line
        if (!inBlock) {
          paragraph.push(line);
        } else {
          result.push(line);
        }
      }
    }
    
    // Close any remaining paragraph
    if (paragraph.length) {
      result.push('<p>' + paragraph.join('\n') + '</p>');
    }
    
    html = result.join('\n');
    
    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      html = html.replace(`###CODEBLOCK${index}###`, block);
    });
    
    // Restore inline code
    inlineCode.forEach((code, index) => {
      html = html.replace(`###INLINECODE${index}###`, code);
    });
    
    return html;
  }
}