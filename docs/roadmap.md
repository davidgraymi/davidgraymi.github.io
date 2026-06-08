# Roadmap — davidmgray.com

> Phased plan to take the site from current state to the brand defined in [brand-identity.md](./brand-identity.md), implementing [feature-spec.md](./feature-spec.md). Now / Next / Later.
>
> **Framing:** this is a repositioning site — cloud/platform engineer with systems depth, *building toward* ML-platform / AI-infra (*from the metal to the model*). The roadmap is sequenced so the work that **earns the AI half** (a built AI-infra project + sharp POV writing) is treated as first-class, not deferred. Honesty rule governs all copy (brand §0).

## Current state (baseline, June 2026)
- Hugo + Vue islands, deployed to GitHub Pages at `davidmgray.com`.
- Home single-page with hero (particle field), experience, projects, contact anchors.
- Content reflects the *old* embedded-first identity and needs rewriting to the cloud→AI positioning.
- Content inventory: 5 experience entries, 8 projects (markdown), Wordlet app under `/wordlet/`. No AI-infra project yet, no blog, no playground hub, no light/dark toggle, no PDF resume confirmed, no analytics.
- Particle hero works but colors flicker (random per-frame RGB).

---

## NOW — foundation, narrative & the repositioning core
Get the brand system in, make the recruiting path airtight, and start earning the AI half immediately.

1. **Design tokens** — one CSS variables file: colors (brand §7, teal/violet on near-black), type scale, spacing, radius. Wire existing styles to tokens. *(blocks most visual work)*
2. **Rewrite the narrative copy** — hero tagline → *"From the metal to the model"*; about/bio → stack-up narrative (metal → systems → cloud → AI infra) with honest cloud-now/AI-direction framing; experience reframed so embedded reads as edge, not ceiling. Apply the honesty rule throughout.
3. **Fix the particle field** — palette-driven teal→violet→coral coloring (no flicker), reduced-motion fallback, offscreen/hidden-tab pause, responsive particle cap. Make it the stable signature motif.
4. **Recruiting path** — convert `Resume.docx` → PDF in `/static/` (resume itself reframed for cloud/AI infra); resume button in nav + hero + contact; contact block with the honest open-to copy (ML-platform + cloud roles) + mailto.
5. **First POV blog post** — stand up `/blog/` minimally and publish one sharp post (e.g. "what good LLMOps/MLOps should look like, from someone who's been in the systems"). This is the highest-signal repositioning move available without new infra work. (Blog is P0 — brand §5.)
6. **SEO/meta baseline** — per-page titles/descriptions, OG + Twitter cards, OG image from particle motif, `Person` JSON-LD, robots.txt.
7. **Accessibility + perf pass** — keyboard nav, focus states, alt text, contrast AA; confirm Lighthouse ≥ 90 mobile.

**Exit criteria:** brand checklist (brand §11) passes on the home page; the cloud→AI story reads honestly end to end; recruiter reaches resume + contact in <30s; ≥1 POV post live; no motion flicker.

---

## NEXT — proof & content surfaces
Turn the trajectory into evidence; build out the site.

8. **Write up & feature the keystone AI-infra project** *(it already exists — this is the highest-value content task)* — the AWS ML serving + drift-triggered retraining + champion/challenger competition pipeline. Build a strong detail page: the problem (model decay in production), the architecture (serving, drift detection, retraining trigger, head-to-head promotion gate, AWS services used), and the result. Add an architecture diagram. Sanitize anything confidential. Feature it first in the project grid and reference it in the hero/about. **This converts the repositioning from claim to fact — pull it forward; it can ship in NOW alongside the narrative.**
9. **Projects depth** — standardize front matter incl. `layer` tag (systems/cloud/AI) so the metal→model arc is visible; detail pages `/projects/<slug>/`; live/demo/code affordances; lead featured set with the AI-infra project.
10. **Blog cadence** — settle a realistic, sustainable posting rhythm (see decisions); build out post layout (Chroma highlighting, RSS, reading time, tags); reach 3–4 posts spanning systems-depth + cloud-for-AI + a project deep-dive.
11. **Playground hub** — `/playground/` listing Wordlet + particle experiments; make the particle field a tweakable, documented demo (sliders).
12. **Light/dark toggle** — respect `prefers-color-scheme`, persist choice, verify both palettes.

**Exit criteria:** at least one shipped AI-infra project featured with a writeup; every nav item routes to real content; blog has a steady cadence; playground shows ≥ 2 demos.

---

## LATER — refinement & growth
13. **Privacy-friendly analytics** (Plausible/Cloudflare/GoatCounter); track resume + contact + demo events + post reads.
14. **Contact form** (serverless: Formspree/Web3Forms/Cloudflare) if mailto proves too high-friction.
15. **Playful 404** + richer microcopy/empty states.
16. **Styled HTML resume** mirroring site brand at `/resume`.
17. **`/now` page**; more AI-infra projects + posts; consider blog comments (giscus) only if demand appears.

---

## Sequencing notes
- **Token file first** — unblocks every visual task; keystone of the minimalism goal (no magic numbers).
- **Narrative + first POV post are NOW**, not later: the repositioning is mostly a *story-and-evidence* problem, and the cheapest high-signal evidence is sharp writing. Don't wait on the infra project to start telling the story honestly.
- **The keystone AI-infra project already exists** — so the proof problem is mostly a *writeup* problem now, not a *build* problem. That's a big advantage: the single most important evidence for the recruiting goal is ready to document. Treat its detail page + architecture diagram as NOW-tier, alongside the narrative copy.
- Keep each item shippable: deploy after every numbered item rather than batching.

## Resolved decisions
- **Tagline:** *"From the metal to the model."* (directional, honest, memorable)
- **Voice:** sharp & opinionated, from authority (brand §4–5).
- **Visual:** polished with signature moments; cool-technical teal/violet on near-black (brand §6–7).
- **Name/mark:** "David Gray" full name + monospace `DG.` mark.
- **Open to:** ML-platform / AI-infrastructure roles **and** cloud / platform engineering roles, honestly ordered (brand §10).
- **Transition framing:** named as a direction, not a gap; documented openly from authority.

## Resolved (round 2)
- **Contact channel:** expose `davidgraymi@gmail.com` directly (mailto, no form needed for now).
- **Blog cadence:** monthly or less. Posts are quality-over-frequency; feature the blog but don't make stale cadence visible (avoid "latest post" dates that expose long gaps — surface posts by relevance/topic instead).
- **Keystone AI-infra project (already built — this is the proof):** an **end-to-end ML serving + continuous-retraining pipeline on AWS** with **drift detection** that triggers retraining, and a **model-competition (champion/challenger) step** where candidate models go head-to-head before promotion and serving. This is genuine MLOps/AI-infra work and is the single strongest evidence for the repositioning — feature it first (see feature-spec §2.4a).
