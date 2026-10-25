import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

/**
 * Social cards (1200×630) drawn at build time: the dark Instrument Panel theme,
 * one per post, project and top-level page. Satori lays out the text as paths,
 * sharp rasterises it, so the PNG never depends on fonts installed on the machine.
 */

export type Card = {
  /** Mono label top-right, e.g. "Writing" or "Work · Professional". */
  kicker: string;
  title: string;
  description?: string;
  /** Mono text bottom-left; usually the page path. */
  path: string;
  /** Mono text bottom-right, e.g. "Oct 12, 2026 · 6 min read". */
  meta?: string;
  /**
   * The "who I am" layout: headshot centred over title and description. Used on the
   * pages about me rather than about a piece of work. Everything sits in the middle
   * square, so WhatsApp and Telegram's square crops keep the face and name.
   */
  portrait?: boolean;
};

// Dark-theme values from tokens.css. Satori can't read CSS custom properties.
const C = {
  ground: '#06090e',
  rule: '#1e283b',
  text: '#f1f5f9',
  muted: '#94a3b8',
  amber: '#f59e0b',
  amberInk: '#1a1200',
};

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFile(require.resolve(`${pkg}/files/${file}`));

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: 'normal' }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    font('@fontsource/inter', 'inter-latin-400-normal.woff').then((data) => ({ name: 'Inter', data, weight: 400 as const, style: 'normal' as const })),
    font('@fontsource/inter', 'inter-latin-700-normal.woff').then((data) => ({ name: 'Inter', data, weight: 700 as const, style: 'normal' as const })),
    font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-600-normal.woff').then((data) => ({ name: 'Mono', data, weight: 600 as const, style: 'normal' as const })),
  ]));

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

const clip = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`);

/** The homepage headshot, cropped and inlined for Satori. Paths are relative to the repo root (where builds run). */
const headshotPath = 'src/assets/avatar.png';
export const headshot = (w: number, h: number) =>
  sharp(headshotPath).resize(w, h, { fit: 'cover', position: 'top' }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
const headshotUri = async (w: number, h: number) => `data:image/jpeg;base64,${(await headshot(w * 2, h * 2)).toString('base64')}`;

const grid = {
  backgroundImage: `linear-gradient(${C.rule}55 1px, transparent 1px), linear-gradient(90deg, ${C.rule}55 1px, transparent 1px)`,
  backgroundSize: '64px 64px',
};

const tick = (pos: Record<string, number>) =>
  h('div', { position: 'absolute', width: 9, height: 9, background: C.ground, border: `1.5px solid ${C.muted}`, ...pos });

const ticks = () => [
  tick({ top: -5, left: -5 }),
  tick({ top: -5, right: -5 }),
  tick({ bottom: -5, left: -5 }),
  tick({ bottom: -5, right: -5 }),
];

const badge = (size: number) =>
  h(
    'div',
    {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.amber,
      color: C.amberInk,
      fontFamily: 'Mono',
      fontSize: size / 2,
    },
    'dg',
  );

const toPng = async (tree: Node, width: number, height: number) => {
  const svg = await satori(tree as Parameters<typeof satori>[0], { width, height, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
};

async function renderPortraitCard({ title, description, path }: Card): Promise<Buffer> {
  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.ground,
      ...grid,
      borderTop: `6px solid ${C.amber}`,
      fontFamily: 'Inter',
      color: C.text,
    },
    [
      h('div', { position: 'relative', display: 'flex', padding: 10, border: `1.5px solid ${C.rule}`, background: C.ground }, [
        ...ticks(),
        { type: 'img', props: { src: await headshotUri(244, 244), style: { width: 244, height: 244 } } },
      ]),
      h('div', { fontSize: 76, fontWeight: 700, letterSpacing: -2, marginTop: 32 }, title),
      description ? h('div', { fontSize: 28, color: C.muted, marginTop: 10 }, clip(description, 60)) : null,
      h('div', { display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, fontFamily: 'Mono', fontSize: 20, letterSpacing: 2, color: C.amber }, [
        badge(30),
        `davidmgray.com${path === '/' ? '' : path}`,
      ]),
    ].filter(Boolean),
  );
  return toPng(tree, 1200, 630);
}

export async function renderCard(card: Card): Promise<Buffer> {
  if (card.portrait) return renderPortraitCard(card);
  const { kicker, title, description, path, meta } = card;
  const titleSize = title.length <= 36 ? 76 : title.length <= 64 ? 62 : 52;

  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      background: C.ground,
      ...grid,
      fontFamily: 'Inter',
      color: C.text,
    },
    [
      h('div', { height: 6, background: C.amber }),
      h(
        'div',
        {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          margin: '44px 56px 48px',
          padding: '40px 44px 32px',
          border: `1.5px solid ${C.rule}`,
          background: `${C.ground}e6`,
        },
        [
          ...ticks(),
          h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
            h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
              badge(44),
              h('div', { fontSize: 26, fontWeight: 700 }, 'David Gray'),
            ]),
            h(
              'div',
              { fontFamily: 'Mono', fontSize: 20, letterSpacing: 3, color: C.amber, textTransform: 'uppercase' },
              kicker,
            ),
          ]),
          h(
            'div',
            { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: 20 },
            [
              h('div', { fontSize: titleSize, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }, clip(title, 110)),
              description
                ? h('div', { fontSize: 27, lineHeight: 1.4, color: C.muted }, clip(description, 150))
                : null,
            ].filter(Boolean),
          ),
          h(
            'div',
            {
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 22,
              borderTop: `1.5px solid ${C.rule}`,
              fontFamily: 'Mono',
              fontSize: 20,
              color: C.muted,
            },
            [h('div', {}, `davidmgray.com${path === '/' ? '' : path}`), h('div', {}, meta ?? '')],
          ),
        ],
      ),
    ],
  );

  return toPng(tree, 1200, 630);
}

/**
 * The square "dg" mark used for apple-touch-icon and the schema.org Person image.
 * iMessage and some chat apps show this instead of the social card, so it has to
 * read as the same brand. Full bleed: iOS rounds the corners itself.
 */
export async function renderIcon(size = 512): Promise<Buffer> {
  const tree = h(
    'div',
    {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: C.amber,
      color: C.amberInk,
      fontFamily: 'Mono',
      fontSize: size * 0.5,
      letterSpacing: -size * 0.02,
    },
    'dg',
  );
  return toPng(tree, size, size);
}

/** A faint training-loss curve, the one bit of ML art on the profile headers. */
const lossCurve = (width: number, height: number) => {
  const pts = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    // SVG y grows downward, so a falling loss is a rising y.
    const y = 0.1 + 0.8 * (1 - Math.exp(-4.2 * t)) + 0.025 * Math.sin(i * 1.7) * (1 - t);
    return `${(t * width).toFixed(1)},${(y * height).toFixed(1)}`;
  }).join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><polyline points="${pts}" fill="none" stroke="${C.amber}" stroke-width="3" stroke-opacity="0.55" stroke-linejoin="round"/></svg>`;
  return { type: 'img', props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, style: { position: 'absolute', left: 0, top: 0, width, height } } };
};

export type Banner = { width: number; height: number; headline: string; line: string };

/**
 * Profile headers (LinkedIn, X). Both sites lay the profile photo over the bottom-left,
 * so the type sits right-aligned and the loss curve fills the space the photo covers.
 */
export async function renderBanner({ width, height, headline, line }: Banner): Promise<Buffer> {
  const curveH = Math.round(height * 0.62);
  const tree = h(
    'div',
    { width, height, display: 'flex', position: 'relative', background: C.ground, ...grid, borderTop: `6px solid ${C.amber}`, fontFamily: 'Inter', color: C.text },
    [
      h('div', { position: 'absolute', left: 0, top: Math.round(height * 0.16), width: Math.round(width * 0.5), height: curveH, display: 'flex' }, [
        lossCurve(Math.round(width * 0.5), curveH),
      ]),
      h(
        'div',
        {
          position: 'absolute',
          right: Math.round(width * 0.07),
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: Math.round(height * 0.05),
        },
        [
          h('div', { fontSize: Math.round(height * 0.13), fontWeight: 700, letterSpacing: -1.5, textAlign: 'right' }, headline),
          h('div', { fontSize: Math.round(height * 0.06), color: C.muted, textAlign: 'right' }, line),
          h('div', { display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Mono', fontSize: Math.round(height * 0.05), letterSpacing: 2, color: C.amber }, [
            badge(Math.round(height * 0.075)),
            'davidmgray.com',
          ]),
        ],
      ),
    ],
  );
  return toPng(tree, width, height);
}
