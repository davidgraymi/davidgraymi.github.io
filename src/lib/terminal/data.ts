import { existsSync } from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { site, socials } from '~/site.config';
import { hasPhotos, visibleNav } from '~/lib/nav';
import { games } from '~/data/games';
import type { TerminalData, TerminalEntry } from './types';

/** Games the `play` command can launch: the /play catalog, plus Wordlet's Flutter build in public/. */
function findGames(): TerminalData['games'] {
  const list = games.map((g) => ({ name: g.slug, href: `/play/${g.slug}`, summary: g.title }));
  if (existsSync(path.join(process.cwd(), 'public/wordlet/index.html'))) {
    list.push({ name: 'wordlet-endless', href: '/wordlet', summary: 'Endless Wordlet, the original Flutter build' });
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
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
