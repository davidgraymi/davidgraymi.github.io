# Feature Specification — davidmgray.com

> What the site is made of. Defines the information architecture and the requirements for each feature. Pairs with [brand-identity.md](./brand-identity.md) and [roadmap.md](./roadmap.md).

**Positioning context (see brand §0):** This site supports a deliberate repositioning — cloud / platform engineer with deep systems roots, **building toward** ML-platform / AI-infrastructure work. Headline: *From the metal to the model.* The **honesty rule** governs every feature: AI is framed as a direction David is moving toward and documenting, never as a current credential. Primary reader: hiring managers on cloud / AI-infra teams.

**Stack context:** Hugo (static) + Vue 3 islands built with Vite + Three.js available. Hosted on GitHub Pages at `davidmgray.com`. Keep it static; add interactivity as isolated islands, not a full SPA.

---

## 1. Site map

```
/                       Home (single-page scroll + entry point)
  #hero                 Tagline + particle field + primary CTAs
  #about                Short bio, photo, throughline
  #experience           Timeline of roles (Boeing, etc.)
  #projects             Featured project grid → links to detail/demos
  #contact              Hire/contact block
/projects/              Full project index (list)
/projects/<slug>/       Project detail page (writeup + demo/links)
/blog/                  Blog index
/blog/<slug>/           Post
/playground/            Interactive demos hub (Wordlet, particle experiments)
/playground/<slug>/     Individual demo
/resume                 Link/redirect to current resume (PDF)
/now (optional)         "What I'm doing now" page
404                     Playful, on-brand
```

Navigation: Home, Projects, Playground, Blog, Contact (+ resume button, + dark/light toggle). The current single-page anchors stay for the home scroll; top-level sections get their own routes once they have enough content.

---

## 2. Features

### 2.1 Home / Hero — P0
**Goal:** in 5 seconds, communicate who David is; in 30 seconds, reach proof and contact.

Requirements:
- Particle field hero (signature motif) with name, tagline (*"From the metal to the model"*), one-line positioning (brand §1).
- Two CTAs: primary "View work" / "Playground", secondary "Get in touch" or "Resume."
- Respects reduced-motion (static fallback) and performance budget.
- Smooth scroll to sections; sticky minimal nav.

### 2.2 About — P0
- Short bio (~80 words) in brand voice using the **stack-up narrative** (metal → systems → cloud → AI infrastructure). Honest framing: cloud infra now, MS in CS, building toward ML platform.
- State current role accurately (product security engineer on a cloud infrastructure team) and the ML-platform / AI-infra target as a *direction*, not a present credential. Honesty rule applies (brand §0).
- Photo/avatar. Optional fun fact line.
- Links to resume and key profiles.

### 2.3 Experience — P0
- Reverse-chronological timeline from `content/experience/*.md`.
- Each entry: role, company, dates, location, metric-led bullets (already well-written — preserve).
- Visual: clean timeline; subtle motion on scroll-in (reduced-motion safe).

### 2.4 Projects — P0
**This is core proof, and it carries the repositioning.** The featured slot is reserved for a **built ML-platform / AI-infra project** — the single strongest piece of evidence that earns the AI half of the story (e.g. a model-serving setup, GPU-scheduled inference, a small MLOps/LLMOps pipeline, or IaC for AI workloads). Without at least one such project, the transition stays aspirational. Treat building it as a roadmap priority, not an afterthought.
- Grid of project cards from `content/projects/*.md`. Tag projects by layer (systems / cloud / AI) so the metal→model arc is visible across the grid.
- Card: title, one-line description, tech tags (mono), type (Personal/School/Work), and an affordance indicating Live demo / Code / Writeup.
- Detail pages (`/projects/<slug>/`): problem, approach, result/metrics, tech, links (repo, demo, downloads), and embedded demo where one exists.
- Featured subset surfaces on the home page; full set at `/projects/`. Lead the featured set with the AI-infra project once it exists.
- Front matter to standardize: `title, summary, tags[], type, layer, repo, demo, featured(bool), weight, downloads[]`.

### 2.4a Flagship project: AWS ML pipeline — P0 (the keystone proof)
The strongest single piece of evidence for the repositioning, and it already exists: an **end-to-end ML serving + continuous-retraining pipeline on AWS** featuring **drift detection** that triggers retraining and a **champion/challenger competition** where candidate models go head-to-head before promotion and serving. This is genuine MLOps/AI-infra work — it is what makes "building toward AI infrastructure" *true*.

Requirements for its detail page (`/projects/<slug>/`):
- **Problem framing:** production models decay; this pipeline detects drift and keeps the served model the best available, automatically.
- **Architecture section with a diagram:** data/inference flow → drift detection → retraining trigger → model competition (head-to-head eval) → promotion gate → serving. Name the AWS services used.
- **The systems angle (the edge):** tie the design choices to systems thinking (latency, resource use, reliability of the promotion gate) — this is where the metal→model throughline pays off.
- **Results / what it demonstrates;** repo link if shareable; **sanitize anything confidential.**
- Feature it **first** in the project grid; reference it from the hero and about as the proof behind the AI direction.
- Tag `layer: AI`.

### 2.5 Playground — P1
**The differentiator.** Interactive demos as first-class content.
- Hub page listing demos with live thumbnails/previews.
- Existing: **Wordlet** (Flutter app already in `/wordlet/`), particle experiments.
- Each demo: embedded or linked, short "what & how" note, link to source.
- Treat the particle field itself as a documented, tweakable demo (sliders for count, palette, repel radius) — shows craft.

### 2.6 Blog — P0 (the engine of the repositioning)
**This is how David earns the AI half in public** (brand §5). The blog converts the AI-infra *trajectory* into *evidence* by demonstrating a practitioner's point of view. It is not a "learning log" — every post is written from authority (systems engineer forming opinions), never from apology. Promote to P0: for this repositioning, sustained sharp writing matters as much as projects.
- `content/blog/*.md`, index at `/blog/`, RSS (Hugo built-in).
- Post layout: title, date, reading time, tags, prose ≤ 70ch, code blocks with syntax highlighting (Hugo Chroma), prev/next.
- Topics to seed (POV-forward, metal→model): "What good LLMOps/MLOps should look like (from someone who's been in the systems)"; cloud-for-AI / model-serving / GPU-scheduling notes; an AI/ML project deep-dive (Sign Language Translator); a systems-depth piece (kernel/RTOS) that frames embedded as the edge; "how this site works."
- Front matter: `title, date, summary, tags[], draft`.
- **Cadence: monthly or less** — quality over frequency. Surface posts by topic/relevance rather than a prominent "latest" date, so infrequent posting never reads as a stale blog.
- Optional: tag/category archive pages (Hugo taxonomies already scaffolded in `tags/`, `categories/`).

### 2.7 Hire / Contact — P0
**Recruiting conversion point.**
- **Open-to statement (honest, ordered):** open to **ML-platform / AI-infrastructure roles** and to strong **cloud / platform engineering roles**. Lead with current strength, name the direction without overclaiming, e.g. *"Open to ML-platform and cloud-infrastructure roles. I do cloud infra now and I'm building toward the AI-infra version of it."* (brand §10)
- Primary contact: **`davidgraymi@gmail.com` exposed directly** via mailto. No contact form for now (decided). Optionally lightly obfuscate in markup to reduce scraping, but keep it one click.
- Resume download button (PDF — convert the existing `Resume.docx`).
- Social/profile links: GitHub (`davidgraymi`), LinkedIn (`david-gray-mi`), X (`gray_dave_`).

### 2.8 Resume — P0
- Maintain a current **PDF** resume in `/static/` and link from nav + contact + hero.
- `/resume` redirects to the PDF (or a styled HTML resume that mirrors the site brand — nice-to-have).

### 2.9 SEO, meta & sharing — P0 (cross-cutting)
- Per-page `<title>`, meta description, canonical.
- Open Graph + Twitter card tags with an OG image (derive from particle motif).
- `sitemap.xml` (Hugo built-in — already present), `robots.txt`, structured data (`Person` JSON-LD on home).
- Fast, accessible, mobile-first (see brand §9, motion & performance budget).

### 2.10 Analytics — P2
- Privacy-friendly, cookieless (Plausible / Cloudflare Web Analytics / GoatCounter). No Google Analytics required.
- Track: page views, resume downloads, contact clicks, demo opens.

### 2.11 404 & microcopy — P2
- On-brand playful 404 (particle motif + witty line). This is the sanctioned place for personality.

---

## 3. Non-functional requirements

- **Performance:** Lighthouse ≥ 90 mobile; LCP < 2.5s; CLS < 0.1. Vue/Three islands lazy-loaded; no render-blocking.
- **Accessibility:** WCAG 2.1 AA. Keyboard navigable. Reduced-motion honored. Semantic HTML, alt text, focus states.
- **Responsive:** mobile-first; breakpoints ~480 / 768 / 1024 / 1280.
- **Theming:** dark + light, respects `prefers-color-scheme`, manual toggle persisted.
- **Maintainability (minimalism):** content is plain markdown front matter; adding a project/post = one file. Design tokens centralized (one CSS variables file). Build is one command (`npm run build`).
- **CI/CD:** GitHub Actions builds Hugo + Vite and deploys to Pages on push to main. Verify the `.github/` workflow.

---

## 4. Content model (front matter standards)

**Project** (`content/projects/<slug>.md`)
```yaml
title: "Sign Language Translator"
summary: "Real-time ASL classifier, 98.8% accuracy."
tags: ["Python", "PyTorch", "Computer Vision"]
type: "Personal"          # Personal | School | Work
repo: "https://github.com/..."
demo: ""                   # optional live URL
featured: true
weight: 10                 # sort order
downloads:
  - { name: "report", url: "id3_report.docx" }
```

**Post** (`content/blog/<slug>.md`)
```yaml
title: "Engineering a processor from scratch"
date: 2026-06-08
summary: "What building a kernel and scheduler taught me about ‘magic.’"
tags: ["embedded", "C", "RTOS"]
draft: false
```

**Experience** (`content/experience/<slug>.md`) — keep current schema (`title, company, date, location` + bullet body).

---

## 5. Out of scope (for now)
- Full SPA / framework rewrite — stay static + islands.
- Comments system on blog (revisit if there's demand; consider giscy/utterances later).
- CMS — markdown in git is the CMS.
- Newsletter — defer.
