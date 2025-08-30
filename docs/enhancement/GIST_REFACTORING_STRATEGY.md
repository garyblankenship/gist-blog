# Gist Content Enhancement Strategy

## Overview
This document outlines the complete workflow for enhancing and refactoring GitHub Gists that power the gary.info blog. This strategy will be used for years of continuous content improvement.

## The Complete Enhancement Workflow

### 1. Identify Target Gist
```bash
# Find gist ID from URL or search
curl -s "https://gary.info" | grep -o 'href="/gist/[^"]*'
# Or directly from GitHub
gh gist list | grep "keyword"
```

### 2. Fetch and Analyze Current Content
```bash
# View gist details
gh gist view <gist-id>

# Get direct URL
echo "https://gary.info/gist/<gist-id>"
```

### 3. Content Enhancement Process

#### Use Content Specialist Agent
```
@agent-content-specialist please fetch the article content and enhance it following the ARTICLE_ENHANCEMENT_TEMPLATE.md guidelines. 

CRITICAL REQUIREMENTS:
1. H2 headings must tell the complete story when read alone (H2-only TL;DR test)
2. Each H2 must be a complete thought that could work as a standalone tweet
3. Someone reading ONLY the H2s should understand the entire argument in 30 seconds
4. Focus on creating propositional headings that make claims or reveal insights

https://gary.info/gist/<gist-id>
```

#### Apply the Enhancement Template
Follow the structured approach in `ARTICLE_ENHANCEMENT_TEMPLATE.md`:

1. **H2 Heading Structure**: Each heading must be a complete, propositional thought
2. **Skimmability Test**: Headings alone should tell the complete story
3. **Paragraph Pattern**: Bridge → Evidence → Transition
4. **Visual Scanning**: Bold key phrases, adequate white space
5. **Dual Service**: 30-second scan OR 5-minute deep read

#### Core Enhancement Rules
- **Headlines as Insights**: Each H2 makes a claim or reveals a truth
- **Progressive Argument**: Headings build upon each other logically  
- **Concrete Over Abstract**: Specific examples and sensory details
- **No Wall of Text**: Max 5 sentences per paragraph
- **Forward Momentum**: Each section ends with a hook to continue

### 4. Update Gist Content

#### Method 1: Update via file redirect (WORKING METHOD)
```bash
# Save enhanced content to temp file and update
cp enhanced_article.md /tmp/watts-nostalgia.md
cd /tmp
gh gist edit <gist-id> watts-nostalgia.md < /tmp/watts-nostalgia.md
```

#### Alternative: Direct stdin (may not work reliably)
```bash
# This method sometimes fails silently
cat enhanced_article.md | gh gist edit <gist-id> -f <filename>
```

#### Method 2: Update description for title change
```bash
# Update gist description (becomes the article title)
gh gist edit <gist-id> -d "New Title Here #tag1 #tag2"
```

### 5. Clear Cache for Immediate Updates

#### Clear specific gist cache
```bash
wrangler kv key delete "gist-<gist-id>" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote
```

#### Clear gists list cache (if title/description changed)
```bash
wrangler kv key delete "gists-list" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote
```

### 6. Verify Updates
```bash
# Check live site (wait 30 seconds for cache clear)
curl -s "https://gary.info/gist/<gist-id>" | grep -o '<h1[^>]*>[^<]*</h1>'

# Check content preview
curl -s "https://gary.info/gist/<gist-id>" | head -50
```

## Key Technical Details

### Cloudflare Worker Caching
- **Cache TTL**: 5 minutes (300 seconds)
- **KV Namespace**: `GIST_CACHE` (ID: 32857727c97346c38c0eabdec7c0f551)
- **Cache Keys**: 
  - Individual gist: `gist-<gist-id>`
  - Gists list: `gists-list`

### GitHub API Integration
- **Pagination**: Worker fetches up to 100 gists per page (max 1000 total)
- **Public Only**: Worker filters to show only public gists
- **Sorting**: Newest first by creation date

### Content Structure
- **Title Source**: Gist description becomes H1 title
- **Tags**: Hashtags in description become article tags
- **URL Pattern**: `https://gary.info/gist/<gist-id>`
- **File Format**: Markdown files (.md)

## Batch Enhancement Strategy

### For Multiple Articles
```bash
# 1. List all gists with descriptions
gh gist list --limit 100 > gists_to_enhance.txt

# 2. Process each with content-specialist
# 3. Update in batches to avoid rate limits
# 4. Clear entire cache after batch update
wrangler kv key delete "gists-list" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote
```

## Best Practices

### Content Enhancement
1. **Preserve Core Message**: Never lose the original insight
2. **Improve Accessibility**: Make complex ideas approachable
3. **Add Structure**: Break walls of text into digestible sections
4. **Enhance Examples**: Add concrete, relatable analogies
5. **Maintain Voice**: Keep author's unique perspective
6. **H2-Only TL;DR**: Ensure headings alone convey the complete argument
7. **30-Second Value**: Busy reader gets full insight from heading scan
8. **Propositional Headlines**: Each H2 makes a claim or reveals truth
9. **Progressive Logic**: Headings build on each other to form narrative
10. **Tweet-Worthy**: Each H2 could stand alone as valuable content

### Technical Workflow
1. **Always backup**: Save original content before editing
2. **Test locally**: Use `npm run dev` to preview changes
3. **Clear cache**: Both specific gist and list cache if needed
4. **Verify deployment**: Check live site after updates
5. **Document changes**: Note major enhancements in memory

## Common Issues & Solutions

### Issue: Changes not appearing
**Solution**: Clear both specific gist cache and gists-list cache

### Issue: Title not updating
**Solution**: Title comes from gist description, not file content
```bash
gh gist edit <gist-id> -d "New Title #tags"
```

### Issue: 404 on gist page
**Solution**: Ensure gist is public
```bash
gh gist view <gist-id> | grep "public"
```

### Issue: Old content after update
**Solution**: Wait 5 minutes for cache TTL or manually clear KV cache

## Memory Integration

This strategy should be stored in:
- Project memory: `/Users/vampire/www/gist/memory.md`
- Global patterns: For cross-project content enhancement techniques
- Workflow documentation: For team reference

## Future Enhancements

### Planned Improvements
- Automated content analysis scoring
- Batch processing scripts
- A/B testing for enhanced versions
- Reader engagement metrics integration
- AI-powered content suggestions

### Long-term Vision
Build a continuous improvement pipeline where all gists are regularly reviewed, enhanced, and optimized based on reader engagement and content quality metrics.

---

*Last Updated: 2025-08-30*
*Strategy Version: 1.0*