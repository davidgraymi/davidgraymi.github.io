import { existsSync } from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { site, socials } from '~/site.config';
import { hasPhotos, visibleNav } from '~/lib/nav';
import type { TerminalData, TerminalEntry } from './types';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const titleFromSlug = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Games the `play` command can launch: any page under src/pages/{play,games,arcade}/,
 * plus Wordlet (a Flutter build in public/). Only things that actually exist are listed.
 */
function findGames(): TerminalData['games'] {
  const sources = import.meta.glob<string>('/src/pages/{play,games,arcade}/**/*.{astro,md,mdx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  const games = Object.entries(sources)
    .filter(([file]) => !file.includes('['))
    .map(([file, source]) => {
      const href = file
        .replace(/^\/src\/pages/, '')
        .replace(/\.(astro|mdx?)$/, '')
        .replace(/\/index$/, '');
      const name = href.split('/').filter(Boolean).pop() ?? href;
      // Use the page's own title (`<Base title="…">` or frontmatter) when it has one.
      const title = source.match(/\btitle[=:]\s*["']([^"']+)["']/)?.[1];
      return { name: slugify(name), href, summary: title ?? titleFromSlug(name) };
    })
    // Skip the section index itself (/play), keep /play/<game>.
    .filter((g) => g.href.split('/').filter(Boolean).length > 1);

  if (existsSync(path.join(process.cwd(), 'public/wordlet/index.html'))) {
    games.push({ name: 'wordlet', href: '/wordlet', summary: 'Word guessing game, built in Flutter' });
  }
  const seen = new Set<string>();
  return games
    .filter((g) => (seen.has(g.name) ? false : (seen.add(g.name), true)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

let cached: Promise<TerminalData> | undefined;

/** Every page embeds the same data, so build it once per production build (fresh each request in dev). */
export function buildTerminalData(): Promise<TerminalData> {
  if (!import.meta.env.PROD) return collect();
  return (cached ??= collect());
}

async function collect(): Promise<TerminalData> {
  const work: TerminalEntry[] = (await getCollection('work', ({ data }) => !data.draft))
    .sort((a, b) => a.data.order - b.data.order)
    .map((p) => ({ slug: p.id, title: p.data.title, href: `/work/${p.id}`, summary: p.data.blurb, meta: p.data.year }));

  const blog: TerminalEntry[] = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((b) => ({
      slug: b.id,
      title: b.data.title,
      href: `/blog/${b.id}`,
      summary: b.data.description,
      meta: b.data.pubDate.toISOString().slice(0, 10),
    }));

  const dirs: TerminalData['dirs'] = { work, blog };
  if (await hasPhotos()) {
    dirs.photos = (await getCollection('photos', ({ data }) => !data.draft))
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((a) => ({
        slug: a.id,
        title: a.data.title,
        href: `/photos/${a.id}`,
        summary: a.data.location ?? `${a.data.images.length} photos`,
        meta: a.data.date.toISOString().slice(0, 10),
      }));
  }

  // Directory names match the URL, so `cd blog` works even though the nav says "Writing".
  const sections = [
    ...(await visibleNav()).map((item) => ({ name: item.href.slice(1), title: item.label, href: item.href })),
    { name: 'resume', title: 'Resume', href: '/resume' },
  ];

  return {
    host: new URL(site.url).hostname,
    site: {
      name: site.name,
      role: site.role,
      location: site.location,
      tagline: site.tagline,
      availability: site.availableForWork ? site.availabilityNote : undefined,
      email: site.email,
    },
    socials: socials.filter((s) => s.href.startsWith('http')).map((s) => ({ name: s.label.toLowerCase(), href: s.href })),
    sections,
    dirs,
    games: findGames(),
  };
}
