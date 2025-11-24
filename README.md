# David Gray's Personal Website

This is a **Hugo** static site with **Vue.js** interactive components.

## Project Structure

- `content/`: Markdown content.
- `layouts/`: HTML templates.
- `static/`: Static assets (images, CSS, compiled JS).
- `src/interactive/`: Vue.js source code.

## Development

1. **Install dependencies**: `npm install`
2. **Build interactive bundle**: `npm run build`
3. **Run Hugo**: `hugo server`

## Adding Content

Create a new markdown file in `content/projects/` or `content/experience/`.
Example:
```markdown
---
title: "My New Project"
link: "https://github.com/..."
type: "Personal"
---
Description here...
```
