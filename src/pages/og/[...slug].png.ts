import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard, type Card } from '~/lib/og';
import { pageCards } from '~/lib/og-pages';
import { readingStats } from '~/lib/reading';
import { games } from '~/data/games';

const date = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export const getStaticPaths = (async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const work = await getCollection('work', ({ data }) => !data.draft);

  const cards: { slug: string; card: Card }[] = [
    ...Object.entries(pageCards).map(([slug, card]) => ({ slug, card })),
    ...posts.map((p) => ({
      slug: `blog/${p.id}`,
      card: {
        kicker: 'Writing',
        title: p.data.title,
        description: p.data.description,
        path: `/blog/${p.id}`,
        meta: `${date(p.data.pubDate)} · ${readingStats(p.body).minutes} min read`,
      },
    })),
    ...work.map((w) => ({
      slug: `work/${w.id}`,
      card: {
        kicker: `Work · ${w.data.kind}`,
        title: w.data.title,
        description: w.data.blurb,
        path: `/work/${w.id}`,
        meta: w.data.stack.slice(0, 3).join(' · '),
      },
    })),
    ...games.map((g) => ({
      slug: `play/${g.slug}`,
      card: {
        kicker: `Play · vs. ${g.opponent}`,
        title: g.title,
        description: g.blurb,
        path: `/play/${g.slug}`,
        meta: `${g.length} · ${g.controls}`,
      },
    })),
  ];
  return cards.map(({ slug, card }) => ({ params: { slug }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await renderCard(props.card as Card)), { headers: { 'Content-Type': 'image/png' } });
