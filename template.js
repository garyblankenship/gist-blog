export const STYLES = `<style>
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
