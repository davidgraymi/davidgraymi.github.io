# davidmgray.com

Personal site and portfolio for David Gray — [davidmgray.com](https://davidmgray.com).

Static [Astro](https://astro.build) site, built to plain HTML and deployed to
GitHub Pages by GitHub Actions on every push to `master`. Most pages ship no
JavaScript.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
```

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run check` | Type-check content collections, props and links |
| `npm run check:site` | After a build: internal links, `#anchors` and `security.txt` expiry |
| `npm run resume:pdf` | After a build: print `/resume` to `public/files/David-Gray-Resume.pdf` |

## Adding content

See **[CONTENT.md](CONTENT.md)**. Short version: a post, a project or a photo
album is one markdown file.

## Layout

```
src/
  site.config.ts        name, email, socials, nav — edit this first
  data/resume.ts        jobs, education, skills, homepage stats
  content/
    blog/               posts        -> /blog/<slug>
    work/               projects     -> /work/<slug>
    photos/             albums       -> /photos/<slug>
  assets/               images that get optimised at build time
  components/           Astro components, no framework
  layouts/Base.astro    <html> shell, head, header, footer
  pages/                one file per route
  styles/global.css     design tokens + light/dark themes
public/                 copied to the site root as-is
  CNAME                 custom domain
  files/                resume, project archives
  wordlet/              the Flutter game, served at /wordlet
.github/workflows/      deploy on push to master
```

## Deployment

The workflow in `.github/workflows/deploy.yml` builds the site and publishes it
with `actions/deploy-pages`. It requires the repository's **Settings → Pages →
Build and deployment → Source** to be set to **GitHub Actions**.

The `CNAME` file lives in `public/`, so the custom domain survives every deploy.

Pull requests also run Lighthouse CI (`lighthouserc.json`) over five pages:
accessibility must stay at 95+, best practices and SEO at 90+.

### Security headers

GitHub Pages can't send response headers, so every page carries a
Content-Security-Policy `<meta>` instead, written at the end of the build by
`src/lib/csp-integration.mjs` (inline scripts are allowed by hash only).
HSTS, `frame-ancestors`, `X-Content-Type-Options` and `Permissions-Policy` need
real headers, which means a proxy such as Cloudflare in front of Pages.
`/.well-known/security.txt` expires yearly; `check:site` fails 30 days before.

## Design

One idea: an instrument panel. Near-black ground, hairline rules, monospace
labels, and a single amber signal colour reserved for things you can act on.
Light and dark themes both follow the viewer's system setting unless they pick
one, which is remembered in `localStorage`.
