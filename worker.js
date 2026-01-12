
// ===== CONSTANTS =====
const CONFIG = {
  CACHE_TTL: 300, // 5 minutes
  ITEMS_PER_PAGE: 10,
  API_BASE_URL: 'https://api.github.com',
  GITHUB_USER_AGENT: 'Cloudflare-Worker-Gist-Blog',
  GITHUB_ACCEPT_HEADER: 'application/vnd.github.v3+json',
  RSS_LIMIT: 20,
  MAX_PAGES: 10,
  DEFAULT_SITE_URL: 'https://your-domain.com',
  DEFAULT_SITE_NAME: 'Your Gist Blog',
  MAX_DESCRIPTION_LENGTH: 200
};

// Pre-compiled regex patterns for performance
const ESCAPE_REGEX = /[&<>"']/g;
const ESCAPE_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

// Markdown regex patterns (pre-compiled)
const MARKDOWN_PATTERNS = {
  codeBlocks: /```(\w+)?\n?(.*?)```/gs,
  inlineCode: /`([^`]+)`/g,
  headers: [
    [/^##### (.+)$/gm, '<h5>$1</h5>'],
    [/^#### (.+)$/gm, '<h4>$1</h4>'],
    [/^### (.+)$/gm, '<h3>$1</h3>'],
    [/^## (.+)$/gm, '<h2>$1</h2>'],
    [/^# (.+)$/gm, '<h1>$1</h1>']
  ],
  boldItalic: [
    [/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>'],
    [/\*\*(.+?)\*\*/g, '<strong>$1</strong>'],
    [/\\*(.+?)\\*/g, '<em>$1</em>'],
    [/___(.+?)___/g, '<strong><em>$1</em></strong>'],
    [/__(.+?)__/g, '<strong>$1</strong>'],
    [/_(.+?)_/g, '<em>$1</em>']
  ],
  links: [/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'],
  images: [/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />'],
  blockquotes: [/^> (.+)$/gm, '<blockquote>$1</blockquote>'],
  horizontalRules: [/^---$/gm, '<hr>'],
  [/\*\*\*$/gm]: '<hr>',
  lists: [
    [/^\* (.+)$/gm, '<li>$1</li>'],
    [/^- (.+)$/gm, '<li>$1</li>'],
    [/^\d+\. (.+)$/gm, '<li>$1</li>']
  ],
  listWrap: /(<li>.*<\/li>\s*)+/s,
  blockElements: /^<(h[1-6]|pre|blockquote|ul|ol|hr|li)|<\/(h[1-6]|pre|blockquote|ul|ol)>$/g
};

const STYLES = `<style>
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

/* Enhanced Pagination styles */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 3rem;
    padding: 2rem 1rem;
    border-top: 1px solid var(--border);
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg));
    border-radius: var(--radius);
}

.pagination-first,
.pagination-last,
.pagination-prev,
.pagination-next {
    padding: 0.5rem 0.75rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-width: 2.5rem;
    text-align: center;
}

.pagination-first:hover,
.pagination-last:hover,
.pagination-prev:hover,
.pagination-next:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-numbers {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.pagination-number {
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: all 0.2s ease;
    font-size: 0.9rem;
    min-width: 2.5rem;
    text-align: center;
}

.pagination-number:hover {
    background: var(--bg-secondary);
    border-color: var(--primary);
    transform: translateY(-1px);
}

.pagination-current {
    padding: 0.5rem 0.75rem;
    background: var(--primary);
    color: white;
    border-radius: var(--radius);
    font-weight: 600;
    min-width: 2.5rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-ellipsis {
    padding: 0.5rem 0.25rem;
    color: var(--text-muted);
    font-weight: bold;
}

.pagination-info {
    color: var(--text-muted);
    font-size: 0.875rem;
    text-align: center;
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

.pagination-total {
    color: var(--text-muted);
    font-size: 0.8rem;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .pagination {
        gap: 0.5rem;
        flex-direction: column;
        padding: 1.5rem 0.5rem;
    }

    .pagination-numbers {
        order: 1;
        margin: 0.5rem 0;
        gap: 0.25rem;
    }

    .pagination-info {
        order: 2;
        margin: 0.5rem 0;
        font-size: 0.8rem;
    }

    .pagination-first,
    .pagination-last,
    .pagination-prev,
    .pagination-next,
    .pagination-number,
    .pagination-current {
        padding: 0.4rem 0.6rem;
        font-size: 0.85rem;
        min-width: 2rem;
    }
}

@media (max-width: 480px) {
    .pagination-numbers {
        max-width: 100%;
        justify-content: center;
    }

    .pagination-first,
    .pagination-last {
        display: none; /* Hide first/last on very small screens */
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
</style>`;

// ===== SERVICES =====
class CacheService {
  constructor(env) {
    this.env = env;
  }

  async get(cacheKey) {
    if (!this.env.GIST_CACHE) return null;

    const cached = await this.env.GIST_CACHE.get(cacheKey, 'json');
    const now = Date.now();
    if (cached && cached.timestamp > now - CONFIG.CACHE_TTL * 1000) {
      return cached.data;
    }
    return null;
  }

  async put(cacheKey, data) {
    if (!this.env.GIST_CACHE) return;

    const now = Date.now();
    await this.env.GIST_CACHE.put(cacheKey, JSON.stringify({
      timestamp: now,
      data: data
    }), {
      expirationTtl: CONFIG.CACHE_TTL
    });
  }
}

class GitHubService {
  constructor(githubUser, githubToken) {
    this.githubUser = githubUser;
    this.githubToken = githubToken;
  }

  getHeaders() {
    const headers = {
      'User-Agent': CONFIG.GITHUB_USER_AGENT,
      'Accept': CONFIG.GITHUB_ACCEPT_HEADER
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    return headers;
  }

  async fetchUserGists() {
    const headers = this.getHeaders();
    let allGists = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${CONFIG.API_BASE_URL}/users/${this.githubUser}/gists?per_page=100&page=${page}`, {
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

        if (page > CONFIG.MAX_PAGES) {
          hasMore = false;
        }
      }
    }

    return allGists;
  }

  async fetchGistDetails(id) {
    const headers = this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/gists/${id}`, {
      headers
    });

    if (!response.ok) {
      return null;
    }

    const gist = await response.json();
    return gist.public === true ? gist : null;
  }
}

class ResponseFactory {
  static html(content, status = 200, cacheControl = 'public, max-age=300, s-maxage=3600') {
    return new Response(content, {
      status,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  static rss(content) {
    return new Response(content, {
      headers: {
        'Content-Type': 'application/rss+xml;charset=UTF-8',
        'Cache-Control': 'max-age=3600'
      }
    });
  }

  static xml(content) {
    return new Response(content, {
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8',
        'Cache-Control': 'max-age=3600'
      }
    });
  }

  static error(content, status = 500) {
    return new Response(content, {
      status,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  static notFound(content) {
    return new Response(content, {
      status: 404,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
}

// ===== UTILITIES =====
const Utils = {
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(ESCAPE_REGEX, match => ESCAPE_REPLACEMENTS[match]);
  },

  // Optimized excerpt generation - single pass
  generateExcerpt(content) {
    if (!content) return '';

    let excerpt = content
      .replace(/^#.*$/gm, '')  // Remove markdown headers
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\n+/g, ' ')           // Replace newlines with spaces
      .trim();

    if (excerpt.length > CONFIG.MAX_DESCRIPTION_LENGTH) {
      excerpt = excerpt.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH) + '...';
    }

    return excerpt;
  }
};

// ===== PARSERS =====
class MarkdownParser {
  parseMarkdown(text) {
    // First, extract and protect code blocks
    const codeBlocks = [];
    let html = text;

    // Extract code blocks and replace with placeholders
    html = html.replace(MARKDOWN_PATTERNS.codeBlocks, (match, language, code) => {
      const placeholder = `###CODEBLOCK${codeBlocks.length}###`;
      const lang = language ? language.toLowerCase() : '';
      const langClass = lang ? ` class="language-${lang}"` : '';
      codeBlocks.push(`<pre><code${langClass}>${Utils.escapeHtml(code.trim())}</code></pre>`);
      return placeholder;
    });

    // Extract inline code and protect it
    const inlineCode = [];
    html = html.replace(MARKDOWN_PATTERNS.inlineCode, (match, code) => {
      const placeholder = `###INLINECODE${inlineCode.length}###`;
      inlineCode.push(`<code>${Utils.escapeHtml(code)}</code>`);
      return placeholder;
    });

    // Now escape HTML for the rest of the content
    html = Utils.escapeHtml(html);

    // Apply all transformations in order
    // Headers
    for (const [pattern, replacement] of MARKDOWN_PATTERNS.headers) {
      html = html.replace(pattern, replacement);
    }

    // Bold and italic
    for (const [pattern, replacement] of MARKDOWN_PATTERNS.boldItalic) {
      html = html.replace(pattern, replacement);
    }

    // Links
    html = html.replace(MARKDOWN_PATTERNS.links[0], MARKDOWN_PATTERNS.links[1]);

    // Images
    html = html.replace(MARKDOWN_PATTERNS.images[0], MARKDOWN_PATTERNS.images[1]);

    // Blockquotes
    html = html.replace(MARKDOWN_PATTERNS.blockquotes[0], MARKDOWN_PATTERNS.blockquotes[1]);

    // Horizontal rules
    html = html.replace(MARKDOWN_PATTERNS.horizontalRules[0], MARKDOWN_PATTERNS.horizontalRules[1]);
    html = html.replace(/\*\*\*$/gm, '<hr>');

    // Lists
    for (const [pattern, replacement] of MARKDOWN_PATTERNS.lists) {
      html = html.replace(pattern, replacement);
    }

    // Wrap consecutive list items
    html = html.replace(MARKDOWN_PATTERNS.listWrap, '<ul>$&</ul>');

    // Paragraphs
    const lines = html.split('\n');
    const result = [];
    let paragraph = [];
    let inBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line is a block element
      if (MARKDOWN_PATTERNS.blockElements.test(trimmed)) {
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
    this.siteUrl = env.SITE_URL || CONFIG.DEFAULT_SITE_URL;
    this.siteName = env.SITE_NAME || CONFIG.DEFAULT_SITE_NAME;
    this.cacheService = new CacheService(env);
    this.githubService = new GitHubService(githubUser, githubToken);
    this.markdownParser = new MarkdownParser();
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

    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from GitHub
    const allGists = await this.githubService.fetchUserGists();
    
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

    // Cache the result
    await this.cacheService.put(cacheKey, processed);

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
    for (const [name, file] of Object.entries(gist.files || {})) {
      content = file.content || '';
      filename = name;
      break;
    }

    // Generate excerpt using optimized utility
    const excerpt = Utils.generateExcerpt(content);

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

    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const gist = await this.githubService.fetchGistDetails(id);
    if (!gist) {
      return null;
    }
    
    const processed = this.processGist(gist);

    // Cache the result
    await this.cacheService.put(cacheKey, processed);

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
    const totalPages = Math.ceil(total / CONFIG.ITEMS_PER_PAGE);
    const currentPage = Math.min(Math.max(1, page), totalPages || 1);
    const offset = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    
    // Generate page numbers for pagination controls
    const pageNumbers = this.generatePageNumbers(currentPage, totalPages);
    
    return {
      items: items.slice(offset, offset + CONFIG.ITEMS_PER_PAGE),
      current_page: currentPage,
      total_pages: totalPages,
      total_items: total,
      has_prev: currentPage > 1,
      has_next: currentPage < totalPages,
      page_numbers: pageNumbers
    };
  }

  generatePageNumbers(currentPage, totalPages) {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 4) {
      // Near the beginning: 1, 2, 3, 4, 5, ..., last
      pages.push(2, 3, 4, 5);
      if (totalPages > 6) pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Near the end: 1, ..., n-4, n-3, n-2, n-1, n
      if (totalPages > 6) pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        if (i > 1) pages.push(i);
      }
    } else {
      // In the middle: 1, ..., current-1, current, current+1, ..., last
      pages.push('...');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
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
    return ResponseFactory.html(html);
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
    return ResponseFactory.html(html);
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
    return ResponseFactory.html(html);
  }

  async generateRSS() {
    const gists = await this.getGists();
    const latestGists = gists.slice(0, CONFIG.RSS_LIMIT); // Latest CONFIG.RSS_LIMIT posts
    
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
      <title>${Utils.escapeHtml(gist.description)}</title>
      <link>${this.siteUrl}/gist/${gist.id}</link>
      <guid isPermaLink="true">${this.siteUrl}/gist/${gist.id}</guid>
      <description><![CDATA[${Utils.escapeHtml(gist.excerpt)}]]></description>
      <pubDate>${new Date(gist.created_at).toUTCString()}</pubDate>
      ${gist.tags.map(tag => `<category>${Utils.escapeHtml(tag)}</category>`).join('\n      ')}
    </item>`).join('')}
  </channel>
</rss>`;
    
    return ResponseFactory.rss(rss);
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
    
    return ResponseFactory.xml(sitemap);
  }

  show404() {
    const html = this.render('404 - Not Found', this.notFoundView());
    return ResponseFactory.notFound(html);
  }

  showError(message) {
    const html = this.render('Error', this.errorView(message));
    return ResponseFactory.error(html, 500);
  }

  // View methods
  indexView(gists, tags, pagination) {
    return `
      <div class="tags">
        <span>Tags:</span>
        ${tags.map(tag => `
          <a href="/tag/${encodeURIComponent(tag)}" class="tag">#${Utils.escapeHtml(tag)}</a>
        `).join('')}
      </div>

      ${gists.map(gist => `
        <article class="gist-item">
          <h2 class="gist-title">
            <a href="/gist/${encodeURIComponent(gist.id)}">
              ${Utils.escapeHtml(gist.description)}
            </a>
          </h2>
          <div class="gist-meta">
            ${Utils.formatDate(gist.created_at)}
            ${gist.tags.length ? `
              • ${gist.tags.map(tag => `
                <a href="/tag/${encodeURIComponent(tag)}" class="tag-inline">#${Utils.escapeHtml(tag)}</a>
              `).join('')}
            ` : ''}
          </div>
          ${gist.excerpt ? `
            <p class="gist-excerpt">${Utils.escapeHtml(gist.excerpt)}</p>
          ` : ''}
        </article>
      `).join('')}
      
      ${pagination.total_pages > 1 ? `
        <nav class="pagination">
          ${pagination.has_prev ? `
            <a href="/?page=1" class="pagination-first" title="First page">⇤</a>
            <a href="/?page=${pagination.current_page - 1}" class="pagination-prev">← Previous</a>
          ` : ''}
          
          <div class="pagination-numbers">
            ${pagination.page_numbers.map(pageNum => {
              if (pageNum === '...') {
                return '<span class="pagination-ellipsis">...</span>';
              } else if (pageNum === pagination.current_page) {
                return `<span class="pagination-current">${pageNum}</span>`;
              } else {
                return `<a href="/?page=${pageNum}" class="pagination-number">${pageNum}</a>`;
              }
            }).join('')}
          </div>
          
          <div class="pagination-info">
            ${pagination.current_page} of ${pagination.total_pages} 
            <span class="pagination-total">(${pagination.total_items} posts)</span>
          </div>
          
          ${pagination.has_next ? `
            <a href="/?page=${pagination.current_page + 1}" class="pagination-next">Next →</a>
            <a href="/?page=${pagination.total_pages}" class="pagination-last" title="Last page">⇥</a>
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
          <h1>${Utils.escapeHtml(gist.description)}</h1>
          <div class="gist-meta">
            <time datetime="${gist.created_at}">
              Created: ${Utils.formatDate(gist.created_at)}
            </time>
            •
            <time datetime="${gist.updated_at}">
              Updated: ${Utils.formatDate(gist.updated_at)}
            </time>
            ${gist.tags.length ? `
              <div class="tags-inline">
                ${gist.tags.map(tag => `
                  <a href="/tag/${encodeURIComponent(tag)}" class="tag-inline">#${Utils.escapeHtml(tag)}</a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </header>

        <div class="gist-content">
          ${gist.filename ? `
            <div class="filename">${Utils.escapeHtml(gist.filename)}</div>
          ` : ''}
          ${isMarkdown ? `
            <div class="markdown-content">
              ${this.markdownParser.parseMarkdown(gist.content)}
            </div>
          ` : `
            <pre><code>${Utils.escapeHtml(gist.content)}</code></pre>
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

      <h2>Posts tagged with #${Utils.escapeHtml(tag)}</h2>

      ${gists.length === 0 ? `
        <p class="empty-state">No posts found with this tag.</p>
      ` : `
        ${gists.map(gist => `
          <article class="gist-item">
            <h3 class="gist-title">
              <a href="/gist/${encodeURIComponent(gist.id)}">
                ${Utils.escapeHtml(gist.description)}
              </a>
            </h3>
            <div class="gist-meta">
              ${Utils.formatDate(gist.created_at)}
            </div>
            ${gist.excerpt ? `
              <p class="gist-excerpt">${Utils.escapeHtml(gist.excerpt)}</p>
            ` : ''}
          </article>
        `).join('')}
        
        ${pagination.total_pages > 1 ? `
          <nav class="pagination">
            ${pagination.has_prev ? `
              <a href="/tag/${encodeURIComponent(tag)}?page=1" class="pagination-first" title="First page">⇤</a>
              <a href="/tag/${encodeURIComponent(tag)}?page=${pagination.current_page - 1}" class="pagination-prev">← Previous</a>
            ` : ''}
            
            <div class="pagination-numbers">
              ${pagination.page_numbers.map(pageNum => {
                if (pageNum === '...') {
                  return '<span class="pagination-ellipsis">...</span>';
                } else if (pageNum === pagination.current_page) {
                  return `<span class="pagination-current">${pageNum}</span>`;
                } else {
                  return `<a href="/tag/${encodeURIComponent(tag)}?page=${pageNum}" class="pagination-number">${pageNum}</a>`;
                }
              }).join('')}
            </div>
            
            <div class="pagination-info">
              ${pagination.current_page} of ${pagination.total_pages} 
              <span class="pagination-total">(${pagination.total_items} posts)</span>
            </div>
            
            ${pagination.has_next ? `
              <a href="/tag/${encodeURIComponent(tag)}?page=${pagination.current_page + 1}" class="pagination-next">Next →</a>
              <a href="/tag/${encodeURIComponent(tag)}?page=${pagination.total_pages}" class="pagination-last" title="Last page">⇥</a>
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
        <p>${Utils.escapeHtml(message)}</p>
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
    <title>${Utils.escapeHtml(title)}</title>
    <meta name="description" content="${Utils.escapeHtml(description)}">
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${ogType}">
    <meta property="og:title" content="${Utils.escapeHtml(title)}">
    <meta property="og:description" content="${Utils.escapeHtml(description)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="${this.siteName}">
    ${publishedTime ? `<meta property="article:published_time" content="${publishedTime}">` : ''}
    ${modifiedTime ? `<meta property="article:modified_time" content="${modifiedTime}">` : ''}
    ${tags.map(tag => `<meta property="article:tag" content="${Utils.escapeHtml(tag)}">`).join('\n    ')}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${Utils.escapeHtml(title)}">
    <meta name="twitter:description" content="${Utils.escapeHtml(description)}">
    
    <!-- RSS -->
    <link rel="alternate" type="application/rss+xml" title="${this.siteName} RSS Feed" href="/rss.xml">

    ${STYLES}
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
}