export const CSS = `
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
}

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

.gist-excerpt {
    color: var(--text-muted);
    margin-top: 0.5rem;
    line-height: 1.5;
}
`;

export const createLayout = (title, content, siteName = 'gary.info') => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${CSS}</style>
</head>
<body>
    <header>
        <h1 class="site-title">
            <a href="/" style="color: inherit;">${siteName}</a>
        </h1>
    </header>
    <main>
        ${content}
    </main>
</body>
</html>`;