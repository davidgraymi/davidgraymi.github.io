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
| `description` | yes | Listing page + `<meta description>` + social card |
| `pubDate` | yes | `YYYY-MM-DD`, sorts newest first |
| `updatedDate` | no | Renders an "updated" note |
| `tags` | no | List of strings |
| `cover` | no | Relative path to an image in `src/assets/` |
| `coverAlt` | no | Alt text — write one if you use a cover |
| `draft` | no | `true` hides it from the site and the RSS feed |

`src/content/blog/starter-post.md` is a draft with every field filled in. Copy
it when you forget the shape.

---

## Add a project

Create `src/content/work/my-project.md` → `/work/my-project`.

```markdown
---
title: The thing I built
blurb: One sentence. Shows on the card and in search results.
kind: Personal          # Professional | Personal | School | Capstone | Research
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

## Change your details, links or nav

`src/site.config.ts` — name, role, email, location, availability pill, social
links and the nav bar. Everything on the site reads from it.

`src/data/resume.ts` — jobs, education, skills, the homepage stat strip, and the
three "how I can help" cards on the homepage.

To take down the "open to consulting" pill, set `availableForWork: false`.

---

## Replace the photo of yourself

Overwrite `src/assets/avatar.png`. It appears on the homepage and `/about`.

## Replace the social share card

`public/og.png`, 1200×630. This is what shows up when someone pastes a link
into Slack, LinkedIn or iMessage.

## Replace the résumé

Overwrite `public/files/Resume.docx`. If you export a PDF instead, drop it in
`public/files/` and update the `Résumé` entry in `src/site.config.ts`.
