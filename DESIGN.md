# Design system — "Instrument Panel"

Amber signal on ink and white (light) or obsidian (dark). Ruled hairline panels, square cards, pill buttons. Precise, technical, quiet until something matters.

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
| `primary` / `on-primary` | The one action or signal that matters in view. Links in prose. |
| `primary-container` | Active nav item, "Playable"-style accent chips, quote tint. |
| `secondary` | Sparing second accent (the hero shimmer, a single badge). |
| `surface` → `surface-container-highest` | Page → raised layers. In light mode the page is white and containers are amber tints, never grey. |
| `rule-soft` | Inner dividers between ruled cells; quieter than the `outline-variant` frame. |
| `signal-block` / `on-signal-block` | The full-bleed amber CTA band. |
| `on-surface` / `on-surface-variant` | Primary text / secondary text and icons. |
| `outline` / `outline-variant` | Emphasised border (hover) / default hairline. |
| `error` | Validation and failure states only. |

All text pairs meet WCAG AA in both themes. Light-mode amber is deliberately darkened (`amber-800`) so white-on-amber buttons pass.

## Type scale

Roboto Flex (sans) for reading, JetBrains Mono for labels, data, and metadata. **12px is the floor.**

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

- **Radius:** cards and panels are square (`rounded-card` = 0). Buttons are `full` pills. The header is a full-width bar flush to the top, split from the page by a hairline; icon buttons and the search field in it are square. Small chips and index tags use `rounded-md`.
- **Elevation:** cards are flat; depth comes from hairlines. 2 for floating chrome, 3–5 for overlays (command palette, menus). No glows.
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
| `.ruled-panel` > `.tick` ×4 + `.ruled-grid` > `.ruled-cell` | Hairline cells with corner ticks | Stats, services, metadata, project and album grids (`WorkCard` is a cell), prev/next links. Add `.is-interactive` only when the cell is clickable or invites hover; `.cell-index` flips to primary on hover |
| `.ruled-list` | Rows split by hairlines, left signal bar on hover | Post lists |
| `.ticked-frame` | Hairline frame with corner ticks around media | Avatars |
| `TableOfContents` component | "On this page" map for long posts | Shown when a post has 3+ `h2`s. Collapsible `.glass-panel` below `xl`; sticky rail with a left signal bar on the current section from `xl` |
| `BackLink` component | Mono label with a square arrow box | Top of every detail page (work, post, album) instead of a pill |
| `.dot-reveal` | Dot matrix fades in from a cell corner on hover | Playful cells (Off the clock), key-metric aside, empty states |
| `.signal-block` + `.btn-ink`, `.ticker` | Full-bleed amber CTA with dot texture and scrolling ticker | `CallToAction`; the footer sits flush after it |
| `.chip` / `.chip-accent` | Tags and tech stack | Accent for at most one chip per card |
| `.filter-tab` (+ `.active`) | Segmented filter | Work index |
| `.link-underline` | Inline link outside prose | |
| `.gridlines` | Faint 4rem grid background | Page headers |
| `.prose` | Long-form article styles | Blog posts, case studies. Images, code blocks and quotes are square like everything else |

## Checklist for new UI

1. Colours come from a role utility; no hex, no `[var(…)]`.
2. Font size comes from the scale; nothing under `text-label`.
3. Interactive targets are at least 44px on touch.
4. It looks right on `/design-system` in both themes.
