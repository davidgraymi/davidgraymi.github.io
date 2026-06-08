# Internal Docs — davidmgray.com

Planning and design documentation for the personal website. These are internal working docs, not published content.

## The short version
David is a **cloud / platform engineer with deep systems roots, building toward ML-platform / AI-infrastructure work.** Headline: ***From the metal to the model.*** Cloud infra is the craft today; AI infra is the documented direction. The **honesty rule** governs everything — AI is framed as a trajectory, never as a current credential. Primary reader: hiring managers on cloud / AI-infra teams.

## Index

- **[brand-identity.md](./brand-identity.md)** — The repositioning (start with §0), positioning, personality, sharp-from-authority voice, the editorial stance for documenting the transition, and the *polished + signature moments* visual direction (cool-technical teal/violet palette, type, the particle motif). Includes a pre-ship brand checklist.
- **[feature-spec.md](./feature-spec.md)** — Site map and per-feature requirements (home, about, experience, projects, playground, blog, hire/contact, resume). Projects center on a built AI-infra proof; blog is P0 as the engine of the repositioning.
- **[roadmap.md](./roadmap.md)** — Now / Next / Later, sequenced so the work that earns the AI half (narrative + POV writing + a built AI-infra project) is first-class. Resolved decisions + remaining open ones.

## Tech stack (summary)
Hugo (static site) + Vue 3 islands (Vite) + Three.js, deployed to GitHub Pages at `davidmgray.com`. Content is markdown front matter; adding a project or post is one file.

## How to use these
1. Brand direction is decided (*polished + signature moments*, cool-technical palette). Start visual work from **brand-identity.md** tokens.
2. Build features in **roadmap.md** order — design tokens first; narrative copy and the first POV post are NOW-tier.
3. Resolve the remaining **open decisions** at the end of roadmap.md (contact channel, blog cadence, which first AI-infra project) before the relevant build steps.
