import { getCollection } from 'astro:content';
import { site } from '~/site.config';

/**
 * Every published post as LinkedIn would announce it. scripts/linkedin.mjs
 * compares this build's copy with the live one, so a post is shared once: on
 * the deploy where it first appears.
 */
export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const body = posts.map(({ id, data }) => ({
    url: new URL(`/blog/${id}`, site.url).href,
    title: data.title,
    description: data.description,
    text: data.linkedin ?? data.description,
    image: new URL(`/og/blog/${id}.png`, site.url).href,
  }));
  return new Response(JSON.stringify(body, null, 1) + '\n', {
    headers: { 'Content-Type': 'application/json' },
  });
}
