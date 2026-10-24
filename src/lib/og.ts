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

const tick = (pos: Record<string, number>) =>
  h('div', { position: 'absolute', width: 9, height: 9, background: C.ground, border: `1.5px solid ${C.muted}`, ...pos });

export async function renderCard({ kicker, title, description, path, meta }: Card): Promise<Buffer> {
  const titleSize = title.length <= 36 ? 76 : title.length <= 64 ? 62 : 52;

  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      background: C.ground,
      backgroundImage: `linear-gradient(${C.rule}55 1px, transparent 1px), linear-gradient(90deg, ${C.rule}55 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
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
          tick({ top: -5, left: -5 }),
          tick({ top: -5, right: -5 }),
          tick({ bottom: -5, left: -5 }),
          tick({ bottom: -5, right: -5 }),
          h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
            h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
              h(
                'div',
                {
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: C.amber,
                  color: C.amberInk,
                  fontFamily: 'Mono',
                  fontSize: 22,
                },
                'dg',
              ),
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

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
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

  const svg = await satori(tree as Parameters<typeof satori>[0], { width: size, height: size, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
