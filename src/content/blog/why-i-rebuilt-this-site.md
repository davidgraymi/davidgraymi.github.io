---
title: I rebuilt this site so that publishing costs one file
description: The old site was a single 41,000-character index.html. Every change was archaeology. Here is what I replaced it with and why the constraint was maintenance, not design.
pubDate: 2026-08-20
tags: ['astro', 'web', 'tooling']
---

The previous version of this site was one `index.html` file, 41,000 characters
long, with the CSS bolted on beside it. It worked. It had been working for
years. That is exactly the problem — it worked well enough that I never rewrote
it, and badly enough that I never added to it.

Every time I finished something worth showing, publishing it meant opening that
file, finding the right nest of `<div>`s, and hand-copying the markup of the
project above it. I did that maybe four times in three years. The friction did
not stop me from building things. It stopped me from telling anyone about them.

## The actual requirement

So the requirement was never "make it look better." It was:

> Adding something new should cost one file and no thinking.

Everything else followed from that. Static, because GitHub Pages is free and I
do not want to operate a server for a personal site. Markdown, because I already
write in it. Content collections with a schema, because I want the build to fail
loudly when I forget a field rather than silently render an empty card.

## What it runs on

[Astro](https://astro.build), building to static HTML. Content lives in
`src/content/` as markdown with typed frontmatter. Images get optimised at build
time. Most pages ship no JavaScript at all — the mobile menu, the theme toggle
and the copy-email button are the only exceptions, and each of them degrades to
a working page if the script never loads.

The whole thing deploys through a GitHub Action on push to `master`. There is no
build step I have to remember to run and no artifact I have to remember to
commit.

## The part I care about more

Rebuilding the site meant re-reading everything I had written about my own work,
and most of it was written in the flattened voice of a résumé. "Developed a Go
HTTPS server to streamline integration testing." True, and it tells you nothing
about the two weeks of finding out why the old process was slow, or the argument
about whether it was worth fixing at all.

The interesting part of engineering is almost never the artifact. It is the
constraint you were under and the thing you chose not to do. That is what I want
this site to be for now.
