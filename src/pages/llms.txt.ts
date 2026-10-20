import { getCollection } from 'astro:content';
import { site, socials } from '~/site.config';
import { education, roles } from '~/data/resume';
import { games } from '~/data/games';

/**
 * /llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI
 * assistants and answer engines. Built from the collections like rss.xml, so a
 * new post or project shows up here without touching this file.
 */

const abs = (path: string) => new URL(path, site.url).href;
const link = (title: string, path: string, note?: string) =>
  `- [${title}](${abs(path)})${note ? `: ${note}` : ''}`;

// AI/ML first: it's where the work is heading. The rest keep their /work order.
const categoryRank = { ai: 0, security: 1, embedded: 2, tools: 3 } as const;

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const work = (await getCollection('work', ({ data }) => !data.draft)).sort(
    (a, b) =>
      categoryRank[a.data.category] - categoryRank[b.data.category] ||
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.order - b.data.order,
  );

  const [current] = roles;
  const [degree] = education;

  const body = [
    `# ${site.name}`,
    '',
    `> ${site.name} is a software engineer in ${site.location} working toward machine learning and AI: applied ML projects, framework performance benchmarking, and a published, cited sign language recognition paper. He is completing an ${degree.degree} at ${degree.school} (${degree.period}) and works as a ${current.title} at ${current.org}.`,
    '',
    'This is his personal site: project write-ups, long-form technical writing, and browser games that run the models from his projects. Contact him at ' +
      `${site.email}. ${site.availableForWork ? `${site.availabilityNote}.` : ''}`.trim(),
    '',
    '## About',
    '',
    link('About', '/about', 'Background, how he got into ML, and what he does outside work'),
    link('Resume', '/resume', 'Experience, education and skills'),
    link('Resume (PDF)', '/files/David-Gray-Resume.pdf'),
    link('Contact', '/contact', 'Consulting, full-time roles, or a second opinion on a hard problem'),
    ...socials.filter((s) => s.href.startsWith('http')).map((s) => `- [${s.label}](${s.href})`),
    '',
    '## Writing',
    '',
    ...posts.map((p) => link(p.data.title, `/blog/${p.id}`, p.data.description)),
    '',
    '## Projects',
    '',
    ...work.map((w) => link(w.data.title, `/work/${w.id}`, w.data.blurb)),
    '',
    '## Optional',
    '',
    ...games.map((g) => link(g.title, `/play/${g.slug}`, g.blurb)),
    link('RSS feed', '/rss.xml'),
    link('Sitemap', '/sitemap-index.xml'),
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
