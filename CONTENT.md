# Adding things to the site

Everything below is a markdown file. Add the file, commit, push to `master`.
GitHub Actions rebuilds and deploys within a couple of minutes. There is no
build step you have to run and nothing to commit into `dist/`.

Run `npm run dev` and open <http://localhost:4321> to see changes live.

---

## Write a blog post

Create `src/content/blog/my-post-slug.md`. The filename becomes the URL:
`/blog/my-post-slug`.

```markdown
---
title: What I learned porting a scheduler
description: One sentence for the listing page and the social card.
pubDate: 2026-09-14
tags: ['embedded', 'c']
---

Your post here. Standard markdown: headings, **bold**, `code`, lists,
> blockquotes, and fenced code blocks with syntax highlighting.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | |
| `seoTitle` | no | Shorter `<title>` for search results. Titles over 70 characters drop the " — David Gray" suffix, and `npm run check:site` fails if they are still too long |
| `description` | yes | Listing page + `<meta description>` + social card |
| `pubDate` | yes | `YYYY-MM-DD`, sorts newest first |
| `updatedDate` | no | Renders an "updated" note |
| `tags` | no | List of strings |
| `cover` | no | Relative path to an image in `src/assets/` |
| `coverAlt` | no | Alt text — write one if you use a cover |
| `draft` | no | `true` hides it from the site and the RSS feed |
| `project` | no | Slug of a `/work` project, e.g. `sign-language-interpreter`. The post links to the project and the project lists the post |
| `linkedin` | no | Text of the LinkedIn post that shares it, sent once by the deploy that first publishes the post. Defaults to `description`; `false` skips LinkedIn. `#words` become hashtags. Setup is at the top of `scripts/linkedin.mjs` |

### Figures and charts

Put the image in `public/images/` and give it a title. A lone image with a title
becomes a numbered, captioned figure:

```markdown
![Alt text that states what the chart shows, e.g. "JAX is fastest on 4 of 5 models"](/images/benchmarks/cpu-latency.webp "Figure 2 — Median latency at batch=32, log scale.")
```

- If `cpu-latency-dark.webp` sits next to it, dark mode shows that instead.
- Width and height are read from the file, images lazy-load, and each one links
  to its full-size file. On phones, charts scroll sideways rather than shrink.
- Wide tables scroll inside their own box, and number columns right-align.

The benchmark charts come from `scripts/blog-charts/generate.py`, which writes
both variants from the data snapshots next to it. See the top of that file to
regenerate them.

---

## Add a project

Create `src/content/work/my-project.md` → `/work/my-project`.

```markdown
---
title: The thing I built
blurb: One sentence. Shows on the card and in search results.
kind: Personal          # Professional | Personal | School | Capstone | Research
category: tools         # Filter tab on /work: embedded | ai | tools
year: '2026'
stack: ['Go', 'Postgres']   # first four show on the card
highlight: The one number worth remembering   # optional, renders in a callout
featured: false         # featured projects lead /work; the top 3 hit the homepage
order: 20               # lower sorts first
links:
  - label: Source on GitHub
    href: https://github.com/davidgraymi/thing
---

The long version. What the constraint was, what you chose not to do,
what you'd change.
```

The homepage shows the three lowest-`order` projects with `featured: true`.

---

## Add a photo album

1. Put the images in `src/assets/photos/<album-slug>/`. Full-size straight off
   the camera is fine — they get resized and converted to WebP at build time.
2. Create `src/content/photos/<album-slug>.md`:

```markdown
---
title: Cozumel, 2026
date: 2026-07-02
location: Cozumel, Mexico
images:
  - src: ../../assets/photos/cozumel/reef.jpg
    alt: A reef wall dropping into blue water
    caption: 40 metres down, no idea what most of this is.
  - src: ../../assets/photos/cozumel/turtle.jpg
    alt: A sea turtle passing over coral
---

Optional intro paragraph, shown above the grid.
```

`alt` is required — the build fails without it, which is the point. `caption`
and the intro paragraph are optional. The album cover defaults to the first
image; set `cover:` to override.

---

## Add a game

Games live on `/play` and each one opens full screen at `/play/<slug>`, with
only a slim bar (back, how to play, full screen, theme) and the game. The page
never scrolls, and arrow keys / Space are kept from scrolling a tall game.

1. Write the game as a self-contained component in `src/components/games/`.
2. Add an entry to `src/data/games.ts`: title, blurb, how-to-play text, who
   you're playing against, and the write-up it came from.
3. Map its slug to the component in `src/pages/play/[game].astro`.
4. `npm run build && npm run games:thumbnails` captures its card preview in
   both themes into `src/assets/games/`. Commit those too.

The same component can also sit inside a post or project write-up; link to the
full-screen version under it with `[Play it full screen →](/play/<slug>)`.

---

## Change your details, links or nav

`src/site.config.ts` — name, role, email, location, availability pill, social
links and the nav bar. Everything on the site reads from it.

`src/data/resume.ts` — jobs, education, skills, the homepage stat strip, and the
three "how I can help" cards on the homepage.

To take down the "open to consulting" pill, set `availableForWork: false`.

---

## Replace the photo of yourself

Overwrite `src/assets/avatar.png`. It appears on the homepage and `/about`.

## Social share cards

Every post, project and top-level page gets its own 1200×630 card, drawn at
build time from its title and description (`src/lib/og.ts`). Nothing to do when
you add content. To change the wording on a top-level page's card, edit
`src/lib/og-pages.ts`.

## Update the resume

Edit `src/data/resume.ts`. `/about` and `/resume` both read from it. Then
regenerate the PDF so the download matches the page:

```bash
npm run build && npm run resume:pdf   # writes public/files/David-Gray-Resume.pdf
```

It prints `/resume` with your local Chrome (set `CHROME_PATH` to use another
Chromium). Commit the PDF along with the data change.

## Analytics

Google Analytics 4 runs on every page. The measurement ID is `analyticsId` in
`src/site.config.ts`; set it to `''` to turn analytics off. It only loads in built
pages and only reports from `davidmgray.com`, so `npm run dev`, previews and
Lighthouse CI don't count as visits. Clicking an email link or "Copy address"
sends a `contact_email` event; outbound links and file downloads come from GA's
own enhanced measurement.
