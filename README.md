# davidmgray.com

Personal site — a single-page, scroll-driven 3D experience built around an F-22
model. Camera cuts between sections as you scroll, from a cinematic idle orbit
through experience, projects, and contact.

**Stack:** Vite · React · Three.js / React Three Fiber + drei · GSAP ScrollTrigger
· Lenis (smooth scroll) · postprocessing · Tailwind CSS.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # → dist/  (static, deployable anywhere)
npm run preview  # serve the production build locally
```

## Content

Section content is authored as markdown in `content/`:

- `content/experience/*.md` — roles (frontmatter: title, company, date, endDate, location)
- `content/projects/*.md` — projects (frontmatter: title, link, type, downloads)

`src/content.js` loads these at build time via `import.meta.glob`, so the markdown
files remain the single source of truth — edit them, not the components.

Downloadable assets (resume, project zips/reports) live in `public/files/`.

## 3D scene

- Model: `public/models/f22.glb` (optimized from the raw Sketchfab glTF with
  `gltf-transform optimize`, ~1.1 MB). License: `public/models/f22-license.txt`.
- The model is auto-centered and auto-scaled at runtime (`JetScene.jsx`), so
  camera keyframes in `src/hooks/useScrollCamera.js` are independent of the
  model's native units.
- Camera keyframes are interpolated per section by GSAP ScrollTrigger; tweak the
  `CAMERA_KEYFRAMES` and `SCRUB` arrays to retune the choreography.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs the Vite
build and publishes `dist/` to GitHub Pages. `public/CNAME` keeps the custom
domain (davidmgray.com).
