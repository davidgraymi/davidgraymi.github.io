---
title: Post template — delete me
description: A reference copy of every frontmatter field a post supports, plus the formatting that renders nicely.
pubDate: 2026-01-01
tags: ['meta']
draft: true
---

This post has `draft: true`, so it never appears on the site or in the RSS feed.
Keep it around as a reference, or delete it.

## Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shows in the listing, the page and the browser tab. |
| `description` | yes | Used on the listing page and for social cards. |
| `pubDate` | yes | `YYYY-MM-DD`. Sorts the listing, newest first. |
| `updatedDate` | no | Renders an "updated" note under the title. |
| `tags` | no | A list of strings. |
| `cover` | no | Path relative to this file, e.g. `../../assets/blog/thing.jpg`. |
| `coverAlt` | no | Alt text for the cover. Write one if you use a cover. |
| `draft` | no | `true` hides the post everywhere. |

## Formatting that works

Normal paragraphs, **bold**, *italic*, `inline code` and
[links](https://example.com).

> Blockquotes get an amber rule on the left.

```go
// Code blocks are syntax highlighted at build time, no client-side JS.
func main() {
	fmt.Println("hello")
}
```

1. Ordered lists
2. Work as expected

- So do unordered ones
- With amber markers

Images placed in `src/assets/` and referenced with a relative path get resized
and converted to modern formats automatically at build time.
