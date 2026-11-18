# Design system — "Workbench"

Precise like an instrument, warm like a workshop. Amber signal on warm paper (light) or charcoal (dark). Serif for the voice, sans for the interface, mono for the evidence. Soft hairline cards; square corners only where the content is a measurement.

## What the design has to prove

The site exists to convince someone that David is a person they'd want to work with. Every trait maps to a concrete decision you can check:

| Trait | Claim | How the design carries it |
| --- | --- | --- |
| **Engineer** | Measurements look like measurements | Mono numerals; `.is-instrument` panels (square, corner ticks) only for stats and metadata |
| **Smart** | Reads like a good essay | Newsreader serif for headlines and articles, 19px prose, a real type hierarchy |
| **Friendly** | Warm, not clinical | Stone and cream neutrals, charcoal instead of blue-black, 14px card corners, a real photo in the hero and on every post |
| **Kind** | Never makes you work for it | Plain labels, 44px targets, AA contrast in both themes, motion only when it explains something |
| **Trustworthy** | Every claim has a receipt | `.receipt-source` links each number to its proof; `.proof-quote` requires a name, role and relationship |
| **Maker** | Products, not features | `.product-card` leads with the problem, shows a live `.status-pill`, ends in one action |

The words follow [`docs/brand-voice.md`](docs/brand-voice.md). The design and the voice should make the same promise: specific, honest, warm.

- **Tokens:** [`src/styles/tokens.css`](src/styles/tokens.css)
- **Components & prose:** [`src/styles/global.css`](src/styles/global.css)
- **Live reference:** [`/design-system`](https://davidmgray.com/design-system) (noindex, not in nav). Run `npm run dev` and open <http://localhost:4321/design-system>.

## Token layers

Each layer may only reference the one above it.

| Layer | Prefix | Example | Used by |
| --- | --- | --- | --- |
| Reference | `--md-ref-*` | `--md-ref-amber-500: #f59e0b` | `tokens.css` only |
| System | `--md-sys-*` | `--md-sys-color-primary` | component CSS, Tailwind bridge |
| Component | `--md-comp-*` | `--md-comp-button-height` | `.btn`, `.surface`, `.chip`, focus ring |

Light and dark values sit on one line with `light-dark()`:

```css
--md-sys-color-primary: light-dark(var(--md-ref-amber-800), var(--md-ref-amber-500));
```

The theme follows the OS unless `<html data-theme="light|dark">` pins it (the toggle sets this and stores it in `localStorage`). To retheme, change reference values; to change what a role means, change the system line. Never add a second dark-mode block.

## Writing markup

Use Tailwind utilities generated from the tokens. Don't reach for `[var(--md-sys-…)]` or inline `style` for colour, size, or shadow.

| Need | Write | Not |
| --- | --- | --- |
| Muted text | `text-on-surface-variant` | `style="color: var(--md-sys-color-on-surface-variant)"` |
| Card background | `bg-surface-container-low` | `bg-[var(--md-sys-color-surface-container-low)]` |
| Hairline | `border border-outline-variant` | `style="border-color: …"` |
| Hover accent | `hover:text-primary` | `hover:text-[var(--md-sys-color-primary)]` |
| Translucent fill | `bg-surface-container-high/88` | `bg-[color-mix(…)]` |
| Depth | `shadow-elevation-1` … `-5` | `shadow-[var(--md-sys-elevation-2)]` |
| Signal glow | `shadow-glow-sm` / `shadow-glow` / `shadow-glow-lg` | ad-hoc `box-shadow` |
| Font size | `text-body-sm`, `text-title`, `text-h1` | `text-[14.5px]` |

Inline `style` is fine for genuinely one-off art (the aurora gradients, the LaCAM visualisation) and values computed at runtime.

## Colour roles

| Role | Use |
| --- | --- |
| `primary` / `on-primary` | **Amber: act here.** The one action or signal that matters in view. Links in prose. |
| `primary-container` | Active nav item, "Playable"-style accent chips, avatar initials. |
| `secondary` / `secondary-container` | **Sage: it works.** Live products, correct answers, availability. Nothing else; selection and decoration use neutrals. |
| `tertiary` | Quiet neutral accent (the "Research" status). |
| `surface` → `surface-container-highest` | Page → raised layers. Light mode is warm paper (`#fdfcfa`) with cream containers; dark mode is warm charcoal (`#14120f`). Neither theme uses a blue-grey. |
| `rule-soft` | Inner dividers between ruled cells; quieter than the `outline-variant` frame. |
| `signal-block` / `on-signal-block` | The full-bleed amber CTA band. |
| `on-surface` / `on-surface-variant` | Primary text / secondary text and icons. |
| `outline` / `outline-variant` | Emphasised border (hover) / default hairline. |
| `error` | Validation and failure states only. |

All text pairs meet WCAG AA in both themes. Light-mode amber is deliberately darkened (`amber-800`) so white-on-amber buttons pass.

## Type scale

Three faces, three jobs. **12px is the floor.**

| Face | Utility | Job | Where |
| --- | --- | --- | --- |
| Newsreader | `font-serif` | **Voice**: how David talks | `text-display`, `text-h1`, `text-h2`, `.prose`, quotes, the author's name |
| Roboto Flex | `font-sans` (default) | **Interface**: what you click | Nav, buttons, card titles and copy, forms, tables, captions |
| JetBrains Mono | `font-mono` | **Evidence**: numbers and labels | Stats, dates, kickers, chips, status pills, code |

Page and section titles are `font-serif font-medium tracking-tight`. Card titles stay sans: they're interface. Newsreader loads as the 58 KB weight-only build, not the 132 KB optical-size build.

| Utility | Size | Use |
| --- | --- | --- |
| `text-display` | fluid 45–83px | Hero only |
| `text-h1` | fluid 34–58px | Page title (`PageHeader`) |
| `text-h2` | fluid 26–38px | Section title (`Section`) |
| `text-headline-lg` / `text-headline` / `text-headline-sm` | 32 / 28 / 22px | Stats, feature headings |
| `text-title` | 20px | Card titles |
| `text-title-sm` | 18px | Page lead |
| `text-body-lg` | 17px | Section lead, intro paragraphs |
| `text-body` | 15px | Default UI copy |
| `text-body-sm` | 14px | Secondary copy, nav |
| `text-caption` | 13px | Metadata, filters |
| `text-label` | 12px | Mono labels, chips, kickers |

## Shape, elevation, motion

- **Radius:** cards and panels are soft (`rounded-card` = 14px). Portraits sit in a 20px mat; figures, code blocks and images in prose use 10px. Buttons are `full` pills. **Square corners mean data:** a `.ruled-panel.is-instrument` (stats strip, post and project metadata) goes square and shows its corner ticks. The header is a full-width bar; icon buttons and the search field in it are square. Small chips and index tags use `rounded-md`.
- **Elevation:** cards are flat; depth comes from hairlines. A `.product-card` lifts to 2 on hover. 2 for floating chrome, 3–5 for overlays (command palette, menus). No glows. Light-mode shadows are tinted warm brown, not black.
- **Motion:** 140ms for state changes, 220ms for reveals, 320ms for page-level movement; `ease-standard` by default. Everything collapses to instant under `prefers-reduced-motion`.

## Components

| Class | What it is | Notes |
| --- | --- | --- |
| `Header` component | Sticky ruled bar: square brand mark, divider, left-aligned links | Active link draws a 2px signal bar on the bottom rule; hover draws it in `outline`. Mobile menu is a full-width `.ruled-list` sheet with mono indices |
| `.wrap` | Page gutter + 76rem max width | 20px gutter on mobile, 32px from `md` |
| `.kicker` | Mono uppercase eyebrow with amber rule | One per section, above the heading |
| `.btn` + `.btn-primary` / `.btn-tonal` / `.btn-ghost` | 44px buttons | One primary per view; `disabled` / `aria-disabled` supported |
| `.surface` | Static card | `--md-comp-card-*` tokens |
| `.spotlight-card` | Interactive card: fills and draws a signal bar on hover | Anything that navigates |
| `.glass-panel` | Static callout frame | Asides, mobile menu |
| `.ruled-panel` > `.tick` ×4 + `.ruled-grid` > `.ruled-cell` | Hairline cells in one soft frame | Services, project and album grids (`WorkCard` is a cell), prev/next links. Ticks are hidden unless the panel is `.is-instrument`. Add `.is-interactive` only when the cell is clickable or invites hover; `.cell-index` flips to primary on hover |
| `.ruled-panel.is-instrument` | Square panel with corner ticks | Measurements only: the homepage stats strip, post and project metadata |
| `.ruled-list` | Rows split by hairlines, left signal bar on hover | Post lists |
| `.ticked-frame` | Soft 20px mat around a portrait | The hero photo |
| `TableOfContents` component | "On this page" map for long posts | Shown when a post has 3+ `h2`s. Collapsible `.glass-panel` below `xl`; sticky rail with a left signal bar on the current section from `xl` |
| `BackLink` component | Mono label with a square arrow box | Top of every detail page (work, post, album) instead of a pill |
| `.dot-reveal` | Dot matrix fades in from a cell corner on hover | Playful cells (Off the clock), key-metric aside, empty states |
| `.signal-block` + `.btn-ink`, `.ticker` | Full-bleed amber CTA with dot texture and scrolling ticker | `CallToAction`; the footer sits flush after it |
| `.chip` / `.chip-accent` | Tags and tech stack | Accent for at most one chip per card |
| `.filter-tab` (+ `.active`) | Segmented filter | Work index |
| `.link-underline` | Inline link outside prose | |
| `.dot-field` | Ink dot texture fading up into the surface (the `.signal-block` dots, neutral) | Page headers. `DotField.astro` enhances the first one on idle (pointer repel, hidden Game of Life); keep the CSS as the no-JS rendering |
| `.prose` | Long-form article styles | Blog posts, case studies. Newsreader 19px / 1.7. Quotes are larger italic serif with a thin amber rule and no box. Tables and captions switch back to sans |

### Trust & product components

These do the persuading, so they only work with real content. Never ship placeholder quotes or invented numbers.

| Class / component | What it is | Rules |
| --- | --- | --- |
| `.status-pill[data-status]` | Mono pill with a state dot: `live`, `beta`, `research`, `archived` | Only `live` is sage. Put one on every product card |
| `ProductCard` component (`.product-card` + `.product-problem`) | A thing people can use today | Order: status → the problem, in italic serif → name → one-sentence what → one primary action + one ghost link ("How I built it") |
| `ProofQuote` component (`.proof-quote` + `.avatar`) | What someone else said | Verbatim; trim whole sentences only. Requires name, role, how you worked together, and a link to the original. An anonymous quote is not proof |
| `.receipt-value` + `.receipt-source` | A number and a link to check it | Every headline number on the site should be able to carry a source link |
| `AuthorCard` component | Photo, name, one sentence, RSS / About / Contact | End of every blog post. Already wired into `blog/[...slug].astro` |

## Page patterns

Homepage section order follows a trust-then-ask sequence: **who I am (hero) → proof (stats with sources, quotes) → what I make (products, then selected work) → how I think (writing) → who I am off the clock → one clear ask (signal block)**. Each section ends with one link onward, not a wall of buttons.

The homepage implements this: hero and stats → **In other words** (`ProofQuote` + receipt, from `src/data/proof.ts`) → **Things you can use** (`ProductCard`, from `src/data/products.ts`; these are left out of Selected work) → services → selected work → writing → off the clock → signal block.

To add proof, append to `quotes` or `receipts` in `src/data/proof.ts`; to add a product, append to `src/data/products.ts`. The hero stats ($90M, 10×, 4×) have no public source, so they stay as plain numbers in the instrument strip. Don't invent links for them.

Social cards (`src/lib/og.ts`), the profile banners in `docs/brand/` (`npm run brand`), and the project cover SVGs in `src/assets/work/` use the same charcoal palette, Newsreader titles and soft frames.

## Checklist for new UI

1. Colours come from a role utility; no hex, no `[var(…)]`. Sage only for "it works".
2. Font size comes from the scale; nothing under `text-label`. Serif for voice, sans for interface, mono for evidence.
3. Square corners and ticks only on measurements.
4. Interactive targets are at least 44px on touch.
5. Any claim, quote or number is real and, where possible, linked to its source.
6. It looks right on `/design-system` in both themes.
