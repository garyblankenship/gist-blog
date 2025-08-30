# Consolidated Gist Enhancement Instructions

## The Golden Rule: H2-Only TL;DR
**Every enhanced article must pass this test**: If someone reads ONLY the H2 headings, they should understand the complete argument in 30 seconds.

## Quick Enhancement Workflow

### 1. Request Enhancement
```
@agent-content-specialist please fetch and enhance this article following the ARTICLE_ENHANCEMENT_TEMPLATE.md guidelines. 

CRITICAL REQUIREMENTS:
1. H2 headings must tell the complete story when read alone
2. Each H2 must be a complete thought that could work as a standalone tweet
3. Someone reading ONLY the H2s should understand the entire argument in 30 seconds
4. Focus on creating propositional headings that make claims or reveal insights

https://gary.info/gist/<gist-id>
```

### 2. Update the Gist
```bash
# Working method that actually updates content
cd /tmp
cp enhanced_article.md filename.md
gh gist edit <gist-id> filename.md < filename.md

# Update title/description if needed
gh gist edit <gist-id> -d "New Title #tag1 #tag2"
```

### 3. Clear Cache & Verify
```bash
# Clear specific gist and list cache
wrangler kv key delete "gist-<gist-id>" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote
wrangler kv key delete "gists-list" --namespace-id 32857727c97346c38c0eabdec7c0f551 --remote

# Verify update
curl -s "https://gary.info/gist/<gist-id>" | grep -o '<h2[^>]*>[^<]*</h2>'
```

## H2 Heading Requirements

### Must Be:
- **Complete thoughts** - Could stand alone as tweets
- **Propositional** - Make claims or reveal insights
- **Progressive** - Build on each other to form narrative
- **Scannable** - Instant understanding without reading paragraphs
- **Value-dense** - Each heading delivers an "aha" moment

### Must NOT Be:
- Generic ("Introduction", "Conclusion", "Overview")
- Incomplete ("The Problem with...")
- Questions without answers ("What is X?")
- Dependent on body text for meaning
- Filler or transition-only headings

## The 5 Power Patterns for H2s

### 1. The Revelation
"The [Surprising Truth] About [Common Belief]"
- "The Hidden Cost of Having Too Many Options"

### 2. The Declaration  
"[Strong Statement That Challenges Assumptions]"
- "Yesterday Wasn't Simpler—You Were"

### 3. The Insight
"[Subject] Is Really About [Deeper Truth]"
- "Nostalgia Is Really About Cognitive Overload"

### 4. The Reframe
"It's Not [X], It's [Y]"
- "It's Not Information Overload, It's Filter Failure"

### 5. The Solution
"How to [Goal] Without [Common Mistake]"
- "How to Be Present Without Ignoring Reality"

## Quality Checks

### The LinkedIn Test
Could you post JUST the H2s on LinkedIn and get engagement?

### The Screenshot Test
Would a screenshot of only the H2s be valuable, shareable content?

### The Executive Test
Would a busy CEO understand your entire point from H2s alone?

### The Tweet Thread Test
Could each H2 be a tweet in a viral thread?

## Content Filtering Rules

### Gists Are Excluded If:
- No description or just filename as description
- No hashtags in description
- Pure code files (.php, .js, .py, etc.) without .md files
- No meaningful content for a blog post

### Gists Are Included If:
- Has hashtags in description (becomes blog post)
- Contains .md or .markdown files (article content)
- Has both description AND tags
- Contains actual article/blog content

## Example: Perfect H2 Structure

**Article: "The Nostalgia Trap"**

Reading ONLY these H2s tells the complete story:
1. "The Beautiful Lie We Tell Ourselves"
2. "The Paradox of Expanding Awareness"
3. "The Weight of Knowing"
4. "The Curation Challenge"
5. "The Practice of Presence"
6. "The Courage to Be Complex"
7. "The Freedom in Conscious Selection"
8. "Living Forward, Not Backward"

**30-Second Takeaway**: We romanticize the past (1) because our awareness expanded (2), creating overwhelm (3) that requires curation (4) through presence (5) and embracing complexity (6) by consciously selecting focus (7) instead of yearning backward (8).

## The Ultimate Goal

Create articles that work on three levels:
1. **H2s only** = Complete understanding in 30 seconds
2. **H2s + first sentences** = Executive summary in 2 minutes
3. **Full article** = Rich, nuanced exploration in 10 minutes

Every reader wins, regardless of available time.

## Key Documents

- `ARTICLE_ENHANCEMENT_TEMPLATE.md` - Complete template system
- `GIST_REFACTORING_STRATEGY.md` - Full technical workflow
- `H2_ONLY_READING_GUIDE.md` - Deep dive on skimmability
- `TEMPLATE_EXAMPLE_NOSTALGIA.md` - Real-world application

## Remember

**The future of content is dual-purpose**: Instant clarity AND infinite depth.

If your H2s don't tell the complete story alone, the article isn't ready to publish.