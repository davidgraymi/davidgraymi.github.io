---
title: This website
blurb: A static site built with Astro, hosted free on GitHub Pages, designed so writing a post costs one markdown file and nothing else.
kind: Personal
year: '2026'
stack: ['Astro', 'TypeScript', 'Tailwind', 'GitHub Pages']
highlight: Zero JavaScript on most pages
order: 12
links:
  - label: Source on GitHub
    href: https://github.com/davidgraymi/davidgraymi.github.io
---

The version of this site you are reading is an Astro project that builds to
plain HTML and deploys to GitHub Pages through GitHub Actions. No server, no
database, no monthly bill.

The design constraint was maintenance, not novelty. Adding a project means
adding one markdown file to `src/content/work/`. Adding a post means one file in
`src/content/blog/`. Adding a photo album means dropping images in a folder and
listing them. Nothing about publishing requires me to remember how the site
works.

Most pages ship zero JavaScript. The exceptions are the mobile menu, the theme
toggle and the copy-to-clipboard button, and all three are progressive
enhancements — the page works with JavaScript off.
