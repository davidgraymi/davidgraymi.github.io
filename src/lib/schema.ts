import { site, socials } from '~/site.config';
import { education } from '~/data/resume';

/** schema.org Person for the homepage and /about. Built from site.config so it never drifts. */
export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: site.url,
  email: `mailto:${site.email}`,
  jobTitle: site.role.split(' — ')[0],
  description: site.tagline,
  image: new URL('/images/david-gray.jpg', site.url).href,
  address: { '@type': 'PostalAddress', addressLocality: 'St. Louis', addressRegion: 'MO', addressCountry: 'US' },
  alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })),
  sameAs: socials.filter((s) => s.href.startsWith('http')).map((s) => s.href),
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
};
