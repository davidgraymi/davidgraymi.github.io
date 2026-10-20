import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Display names for `series:` ids in post frontmatter. */
export const seriesTitles: Record<string, string> = {
  'neural-cost': 'neural-cost: roofline benchmarks',
  'sign-language-capstone': 'The sign language capstone',
};

/** Published posts, newest first. */
export async function publishedPosts(): Promise<Post[]> {
  return (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

/** Every tag with its post count, most-used first. */
export function tagCounts(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }));
}

/** The other posts in this post's series, oldest first, or undefined if it isn't in one. */
export function seriesOf(post: Post, posts: Post[]) {
  const id = post.data.series;
  if (!id) return undefined;
  const parts = posts
    .filter((p) => p.data.series === id)
    .sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
  if (parts.length < 2) return undefined;
  return { title: seriesTitles[id] ?? id, parts, index: parts.findIndex((p) => p.id === post.id) };
}

export const tagHref = (tag: string) => `/blog/tags/${tag}`;
