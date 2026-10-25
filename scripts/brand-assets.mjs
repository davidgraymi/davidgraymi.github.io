#!/usr/bin/env node
// Profile headers and the GitHub repo preview, drawn by the same code as the
// site's social cards and written to docs/brand/. These get uploaded by hand
// (LinkedIn, X, GitHub repo settings), so they live in the repo, not on the site.
//
//   npm run brand
import { mkdir, writeFile } from 'node:fs/promises';
import { renderBanner, renderCard } from '../src/lib/og.ts';

const out = 'docs/brand';
await mkdir(out, { recursive: true });

const headline = 'Machine learning, measured.';
const line = 'ML systems · ML performance · Secure cloud';
const files = {
  'linkedin-header-1584x396.png': renderBanner({ width: 1584, height: 396, headline, line }),
  'x-header-1500x500.png': renderBanner({ width: 1500, height: 500, headline, line }),
  'github-social-preview-1200x630.png': renderCard({
    kicker: 'Source',
    title: 'The source of davidmgray.com',
    description: 'The code behind my site: machine learning projects, benchmarks, writing and games. Built with Astro.',
    path: '/',
    meta: 'github.com/davidgraymi',
  }),
};
for (const [name, png] of Object.entries(files)) {
  await writeFile(`${out}/${name}`, await png);
  console.log(`${out}/${name}`);
}
