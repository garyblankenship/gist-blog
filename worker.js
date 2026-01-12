
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
    [/\*(.+?)\*/g, '<em>$1</em>'],
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
    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Oxygen, Ubuntu, Cantarell, sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', monospace;

    /* Colors - Light theme */
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: #60a5fa;
    --primary-text: #eff6ff;

    --bg: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-code: #f8fafc;

    --text: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #64748b;
    --text-muted: #94a3b8;

    --border: #e2e8f0;
    --border-secondary: #cbd5e1;

    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

    /* Typography scale */
    --radius: 8px;
    --transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
    :root {
        /* Colors - Dark theme */
        --primary: #60a5fa;
        --primary-hover: #93c5fd;
        --primary-light: #3b82f6;
        --primary-text: #0f172a;

        --bg: #0f172a;
        --bg-secondary: #1e293b;
        --bg-tertiary: #334155;
        --bg-code: #1e293b;

        --text: #f8fafc;
        --text-secondary: #e2e8f0;
        --text-tertiary: #cbd5e1;
        --text-muted: #94a3b8;

        --border: #334155;
        --border-secondary: #475569;

        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
        --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
    }
}

* {
    box-sizing: border-box;
}

:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

body {
    font-family: var(--font-family);
    line-height: 1.65;
    color: var(--text);
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
    background: var(--bg);
    font-feature-settings: "kern" 1, "liga" 1;
}

a {
    color: var(--primary);
    text-decoration: none;
    transition: var(--transition);
    position: relative;
}

a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--primary);
    transition: width 200ms ease;
}

a:hover::after {
    width: 100%;
}

a:hover {
    color: var(--primary-hover);
}

/* Typography enhancements */
h1, h2, h3, h4, h5, h6 {
    line-height: 1.3;
    letter-spacing: -0.02em;
    font-weight: 700;
    margin: 2rem 0 1rem 0;
    color: var(--text);
}

h1 { font-size: clamp(2rem, 4vw, 2.5rem); }
h2 { font-size: clamp(1.75rem, 3vw, 2rem); }
h3 { font-size: clamp(1.5rem, 2.5vw, 1.75rem); }
h4 { font-size: 1.25rem; }
h5 { font-size: 1.1rem; }
h6 { font-size: 1rem; }

h1:first-child, h2:first-child, h3:first-child {
    margin-top: 0;
}

header {
    margin-bottom: 4rem;
    position: relative;
}

.site-title {
    font-size: clamp(2.25rem, 5vw, 3rem);
    font-weight: 800;
    margin: 0 0 0.75rem 0;
    letter-spacing: -0.03em;
    color: var(--text);
    text-rendering: optimizeLegibility;
}

.site-tagline {
    margin: 0 0 0 0;
    color: var(--text-muted);
    font-style: italic;
    font-size: 1.125rem;
    font-weight: 400;
    letter-spacing: 0.015em;
}

/* Tags enhancement */
.tags {
    display: flex;
    gap: 0.625rem;
    flex-wrap: wrap;
    align-items: center;
    margin: 2rem 0;
    padding-top: 1rem;
}

.tag {
    background: var(--bg-secondary);
    color: var(--primary);
    padding: 0.375rem 0.875rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    border: 1px solid var(--border);
    transition: var(--transition);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
}

.tag:hover {
    background: var(--primary);
    color: var(--primary-text);
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
}

.tag-inline {
    color: var(--primary);
    margin-right: 0.625rem;
    font-weight: 500;
    letter-spacing: 0.015em;
}

/* Card design */
.gist-item {
    background: var(--bg-secondary);
    padding: 2rem;
    margin-bottom: 1.5rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    transition: var(--transition);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
}

.gist-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary);
    transform: scaleY(0);
    transition: transform 300ms ease;
    opacity: 0.1;
}

.gist-item:hover::before {
    transform: scaleY(1);
    opacity: 1;
}

.gist-item:hover {
    box-shadow: var(--shadow);
    transform: translateY(-2px);
}

.gist-title {
    margin: 0 0 0.75rem 0;
    font-size: clamp(1.25rem, 3vw, 1.5rem);
    font-weight: 700;
    letter-spacing: -0.015em;
    line-height: 1.3;
}

.gist-meta {
    color: var(--text-muted);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.gist-excerpt {
    color: var(--text-secondary);
    margin-top: 1rem;
    line-height: 1.6;
    font-size: 0.95rem;
}

/* Content area */
.gist-content {
    margin: 2.5rem 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
}

.filename {
    padding: 0.75rem 1.25rem;
    background: var(--bg-tertiary);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

pre {
    margin: 0;
    padding: 1.25rem;
    overflow-x: auto;
    background: var(--bg-code);
}

code {
    font-family: var(--font-mono);
    font-size: 0.875rem;
}

/* Markdown content */
.markdown-content {
    padding: 2.5rem;
    line-height: 1.75;
    color: var(--text);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
    margin: 2rem 0 1rem 0;
    line-height: 1.3;
    scroll-margin-top: 100px;
}

.markdown-content h1:first-child,
.markdown-content h2:first-child,
.markdown-content h3:first-child {
    margin-top: 0;
}

.markdown-content h1 {
    font-size: 2.25rem;
    letter-spacing: -0.025em;
}
.markdown-content h2 {
    font-size: 1.75rem;
    letter-spacing: -0.02em;
}
.markdown-content h3 {
    font-size: 1.5rem;
    letter-spacing: -0.015em;
}
.markdown-content h4 {
    font-size: 1.25rem;
    font-weight: 600;
}
.markdown-content h5 {
    font-size: 1.125rem;
    font-weight: 600;
}
.markdown-content h6 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.markdown-content p {
    margin: 1.5rem 0;
    line-height: 1.75;
}

.markdown-content p:first-child {
    margin-top: 0;
}

.markdown-content pre {
    background: var(--bg-code);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    position: relative;
    box-shadow: var(--shadow);
}

.markdown-content code {
    background: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: var(--font-mono);
    border: 1px solid var(--border);
    transition: var(--transition);
}

.markdown-content code:hover {
    background: var(--border);
}

.markdown-content pre code {
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text);
}

/* Code block language indicator */
.markdown-content pre {
    position: relative;
}

.markdown-content pre::before {
    content: attr(data-language);
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
    font-family: var(--font-family);
    border: 1px solid var(--border);
    opacity: 0.8;
}

/* Language-specific syntax highlighting colors */
.markdown-content code.language-python { color: #ff6b6b; }
.markdown-content code.language-javascript { color: #f7b731; }
.markdown-content code.language-go { color: #4dabf7; }
.markdown-content code.language-bash { color: #a3d977; }
.markdown-content code.language-html { color: #ff6b6b; }
.markdown-content code.language-css { color: #4dabf7; }
.markdown-content code.language-json { color: #ced4da; }

.markdown-content blockquote {
    border-left: 4px solid var(--primary);
    margin: 1.5rem 0;
    padding: 1rem 0 1rem 1.75rem;
    color: var(--text-secondary);
    font-style: italic;
    background: var(--bg-secondary);
    border-radius: 0 var(--radius) var(--radius) 0;
    box-shadow: var(--shadow-sm);
}

.markdown-content ul,
.markdown-content ol {
    margin: 1.5rem 0;
    padding-left: 2rem;
}

.markdown-content li {
    margin: 0.75rem 0;
    line-height: 1.6;
}

.markdown-content ul {
    list-style: none;
    padding-left: 1rem;
}

.markdown-content ul li::before {
    content: '•';
    color: var(--primary);
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
}

.markdown-content ol {
    list-style-position: outside;
}

.markdown-content hr {
    border: none;
    border-top: 2px solid var(--border);
    margin: 2.5rem 0;
    opacity: 0.5;
}

.markdown-content img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius);
    margin: 1.5rem 0;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
}

.markdown-content img:hover {
    box-shadow: var(--shadow-lg);
}

.markdown-content a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.01em;
    border-radius: 4px;
    padding: 0.125rem 0.25rem;
    transition: var(--transition);
}

.markdown-content a:hover {
    background: var(--bg-secondary);
    color: var(--primary-hover);
}

.markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5rem 0;
    font-size: 0.875rem;
    box-shadow: var(--shadow-sm);
    border-radius: var(--radius);
    overflow: hidden;
}

.markdown-content th,
.markdown-content td {
    border: 1px solid var(--border);
    padding: 0.875rem 1.25rem;
    text-align: left;
}

.markdown-content th {
    background: var(--bg-tertiary);
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

.markdown-content tr:hover {
    background: var(--bg-secondary);
}

/* Breadcrumb */
.breadcrumb {
    margin-bottom: 2rem;
    color: var(--text-muted);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.breadcrumb a {
    color: var(--text-secondary);
}

.breadcrumb a:hover {
    color: var(--primary);
}

/* Footer */
.gist-footer {
    margin-top: 2.5rem;
    padding-top: 2.5rem;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.875rem;
}

/* Error and empty states */
.error-page {
    text-align: center;
    padding: 5rem 0;
    color: var(--text-muted);
}

.error-page h1 {
    font-size: 2.5rem;
    color: var(--text);
    margin-bottom: 1rem;
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 4rem 0;
}

/* Enhanced Pagination */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 3.5rem;
    padding: 2rem;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg) 100%);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
}

.pagination::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
    opacity: 0.02;
    pointer-events: none;
}

.pagination-first,
.pagination-last,
.pagination-prev,
.pagination-next {
    padding: 0.625rem 1rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: var(--transition);
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 2.75rem;
    text-align: center;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
}

.pagination-first:hover,
.pagination-last:hover,
.pagination-prev:hover,
.pagination-next:hover {
    background: var(--primary);
    color: var(--primary-text);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.pagination-numbers {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.pagination-number {
    padding: 0.625rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: var(--transition);
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 2.75rem;
    text-align: center;
    cursor: pointer;
}

.pagination-number:hover {
    background: var(--bg-tertiary);
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.pagination-current {
    padding: 0.625rem 1rem;
    background: var(--primary);
    color: var(--primary-text);
    border-radius: var(--radius);
    font-weight: 600;
    min-width: 2.75rem;
    text-align: center;
    box-shadow: var(--shadow);
    cursor: default;
}

.pagination-ellipsis {
    padding: 0.75rem 0.375rem;
    color: var(--text-muted);
    font-weight: 600;
}

.pagination-info {
    color: var(--text-muted);
    font-size: 0.875rem;
    text-align: center;
    padding: 0.5rem 0.75rem;
    background: var(--bg-tertiary);
    border-radius: var(--radius);
    border: 1px solid var(--border);
}

.pagination-total {
    color: var(--text-muted);
    font-size: 0.75rem;
    opacity: 0.7;
}

/* Navigation */
.site-nav {
    margin-top: 1.25rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.site-nav a {
    color: var(--text-secondary);
    font-weight: 500;
    letter-spacing: 0.01em;
    transition: var(--transition);
}

.site-nav a:hover {
    color: var(--primary);
}

/* Site footer */
.site-footer {
    margin-top: 5rem;
    padding-top: 2.5rem;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
}

.site-footer a {
    color: var(--primary);
    font-weight: 500;
}

.site-footer a:hover {
    color: var(--primary-hover);
}

/* Responsive design */
@media (max-width: 768px) {
    body {
        padding: 2rem 1.5rem;
        font-size: 0.95rem;
    }

    .gist-item {
        padding: 1.5rem;
    }

    .markdown-content {
        padding: 1.75rem;
    }

    .pagination {
        gap: 0.75rem;
        flex-direction: column;
        padding: 1.75rem 1rem;
    }

    .pagination-numbers {
        order: 1;
        margin: 0.75rem 0;
        gap: 0.375rem;
        justify-content: center;
    }

    .pagination-info {
        order: 2;
        margin: 0.75rem 0;
        font-size: 0.8rem;
        width: 100%;
    }

    .pagination-first,
    .pagination-last,
    .pagination-prev,
    .pagination-next,
    .pagination-number,
    .pagination-current {
        padding: 0.5rem 0.75rem;
        font-size: 0.825rem;
        min-width: 2.25rem;
    }

    .site-title {
        font-size: 2rem;
    }
}

@media (max-width: 480px) {
    body {
        padding: 1.5rem 1rem;
        font-size: 0.9rem;
    }

    .gist-item {
        padding: 1.25rem;
    }

    .markdown-content {
        padding: 1.25rem;
    }

    .pagination-numbers {
        max-width: 100%;
        justify-content: center;
        gap: 0.25rem;
    }

    .pagination-first,
    .pagination-last {
        display: none;
    }

    .site-nav {
        gap: 1rem;
        font-size: 0.8rem;
    }

    .markdown-content h1 {
        font-size: 1.75rem;
    }

    .markdown-content h2 {
        font-size: 1.5rem;
    }

    .markdown-content h3 {
        font-size: 1.25rem;
    }
}

/* Focus states for accessibility */
a:focus-visible,
button:focus-visible,
.pagination-number:focus-visible,
.pagination-first:focus-visible,
.pagination-last:focus-visible,
.pagination-prev:focus-visible,
.pagination-next:focus-visible,
.tag:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --border: #000000;
        --border-secondary: #333333;
        --bg-secondary: #f5f5f5;
        --shadow-sm: none;
        --shadow: none;
        --shadow-md: none;
        --shadow-lg: none;
    }
}

@media (prefers-color-scheme: dark) and (prefers-contrast: high) {
    :root {
        --border: #ffffff;
        --border-secondary: #cccccc;
        --bg-secondary: #1a1a1a;
    }
}
</style>`;

// ===== SERVICES =====
class CacheService {
  constructor(env, metricsService) {
    this.env = env;
    this.metrics = metricsService;
  }

  async get(cacheKey) {
    if (!this.env.GIST_CACHE) return null;

    const cached = await this.env.GIST_CACHE.get(cacheKey, 'json');
    const now = Date.now();
    if (cached && cached.timestamp > now - CONFIG.CACHE_TTL * 1000) {
      // Record metrics if available
      if (this.metrics) this.metrics.recordCacheHit();
      return cached.data;
    }
    // Record metrics if available
    if (this.metrics) this.metrics.recordCacheMiss();
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

  async delete(cacheKey) {
    if (!this.env.GIST_CACHE) return;
    await this.env.GIST_CACHE.delete(cacheKey);
  }

  async invalidateGist(id) {
    // Delete the gist detail cache
    await this.delete(`gist-${id}`);
    // Delete the list cache (tags may have changed)
    await this.delete('gists-list');
  }
}

class GitHubService {
  constructor(githubUser, githubToken) {
    this.githubUser = githubUser;
    this.githubToken = githubToken;
    this.activeRequests = 0;
    this.maxConcurrent = 10;  // Max 10 concurrent requests
    this.requestQueue = [];
  }

  async fetchWithLimit(url, options) {
    // Wait if we've hit the concurrent limit
    while (this.activeRequests >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.activeRequests++;
    try {
      return await fetch(url, options);
    } finally {
      this.activeRequests--;
    }
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
      const response = await this.fetchWithLimit(
        `${CONFIG.API_BASE_URL}/users/${this.githubUser}/gists?per_page=100&page=${page}`,
        { headers }
      );

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
    const response = await this.fetchWithLimit(
      `${CONFIG.API_BASE_URL}/gists/${id}`,
      { headers }
    );

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

// ===== METRICS =====
class MetricsService {
  constructor() {
    this.reset();
  }

  reset() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.apiCalls = 0;
    this.totalRequestTime = 0;
    this.requestCount = 0;
  }

  recordCacheHit() {
    this.cacheHits++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
  }

  recordApiCall() {
    this.apiCalls++;
  }

  recordRequest(duration) {
    this.requestCount++;
    this.totalRequestTime += duration;
  }

  getStats() {
    return {
      cacheHitRate: this.cacheHits + this.cacheMisses > 0
        ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(1) + '%'
        : '0%',
      apiCalls: this.apiCalls,
      avgRequestTime: this.requestCount > 0
        ? (this.totalRequestTime / this.requestCount).toFixed(1) + 'ms'
        : '0ms',
      requestCount: this.requestCount
    };
  }
}

// ===== PARSERS =====
class MarkdownParser {
  parseMarkdown(text) {
    // Process large content in chunks
    if (text.length > 10240) {  // 10KB threshold
      return this.parseInChunks(text);
    }
    return this.parseStandard(text);
  }

  parseStandard(text) {
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

  parseInChunks(text) {
    const chunks = this.splitIntoChunks(text, 2048);
    return chunks.map(chunk => this.parseStandard(chunk)).join('');
  }

  splitIntoChunks(text, chunkSize) {
    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Try to split at paragraph boundary
      let splitPoint = chunkSize;
      if (remaining.length > chunkSize) {
        const newlinePos = remaining.lastIndexOf('\n\n', chunkSize);
        if (newlinePos > chunkSize / 2) {
          splitPoint = newlinePos + 2;
        }
      }

      chunks.push(remaining.substring(0, splitPoint));
      remaining = remaining.substring(splitPoint);
    }

    return chunks;
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
    this.metricsService = new MetricsService();
    this.cacheService = new CacheService(env, this.metricsService);
    this.githubService = new GitHubService(githubUser, githubToken);
    this.markdownParser = new MarkdownParser();
  }

  async handleRequest(request, ctx) {
    const startTime = Date.now();
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
    } finally {
      const duration = Date.now() - startTime;
      this.metricsService.recordRequest(duration);
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

    // Try detail fetch first (has full content)
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