// Post-build checks on dist/ that astro check can't do:
//   1. every internal href/src resolves to a built file (and #fragments to an id)
//   2. security.txt hasn't expired, and won't within 30 days
//   3. every page passes the basics Bing Webmaster Tools flags: a <title> of at
//      most 70 characters, exactly one <h1>, and non-empty alt text on every <img>
//   4. the IndexNow key file is published, so engines accept our submissions
// Run after `npm run build`: npm run check:site
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { INDEXNOW_KEY } from './indexnow.mjs';

const DIST = path.resolve('dist');
const problems = [];

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* htmlFiles(full);
    } else if (entry.name.endsWith('.html')) yield full;
  }
}

const WORDLET = path.join(DIST, 'wordlet') + path.sep; // Flutter build: SEO-checked, links not ours to lint
const MAX_TITLE = 70;

const decodeEntities = (s) =>
  s.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" })[m]);

function checkSeo(page, html) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '');
  if (!title) problems.push(`${page}: missing <title>`);
  else if (title.length > MAX_TITLE) problems.push(`${page}: <title> is ${title.length} chars (max ${MAX_TITLE}): "${title}"`);

  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) problems.push(`${page}: has ${h1s} <h1> tags, expected exactly 1`);

  // Bing reports alt="" (which Astro renders as a bare `alt`) as missing, so every image needs real text.
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="[^"]*\S[^"]*"/.test(img)) problems.push(`${page}: <img> without alt text: ${img.slice(0, 100)}`);
  }
}

const exists = (p) => stat(p).then(() => true, () => false);

/** /work/x -> dist/work/x/index.html; /og/a.png -> dist/og/a.png */
async function resolveTarget(urlPath) {
  const p = path.join(DIST, decodeURIComponent(urlPath));
  if (path.extname(p)) return (await exists(p)) ? p : null;
  for (const candidate of [path.join(p, 'index.html'), `${p}.html`]) if (await exists(candidate)) return candidate;
  return null;
}

const idCache = new Map();
async function idsIn(file) {
  if (!idCache.has(file)) {
    const html = await readFile(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

for await (const file of htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const page = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  checkSeo(page, html);
  if (file.startsWith(WORDLET)) continue;
  for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (!raw.startsWith('/') && !raw.startsWith('#')) continue;
    if (raw.startsWith('//')) continue;
    const url = new URL(raw.replaceAll('&amp;', '&'), `https://site${page}`);
    const target = url.pathname === page && raw.startsWith('#') ? file : await resolveTarget(url.pathname);
    if (!target) {
      problems.push(`${page}: ${attr}="${raw}" does not resolve`);
      continue;
    }
    const id = decodeURIComponent(url.hash.slice(1));
    if (id && target.endsWith('.html') && !(await idsIn(target)).has(id)) {
      problems.push(`${page}: ${attr}="${raw}" points at a missing #${id}`);
    }
  }
}

const securityTxt = await readFile(path.join(DIST, '.well-known/security.txt'), 'utf8').catch(() => '');
const expires = securityTxt.match(/^Expires:\s*(\S+)/m)?.[1];
if (!expires) problems.push('.well-known/security.txt is missing or has no Expires field');
else if (new Date(expires).valueOf() - Date.now() < 30 * 864e5) {
  problems.push(`.well-known/security.txt expires ${expires}; bump it (RFC 9116 allows up to a year)`);
}

const indexNowKey = await readFile(path.join(DIST, `${INDEXNOW_KEY}.txt`), 'utf8').catch(() => '');
if (indexNowKey.trim() !== INDEXNOW_KEY) problems.push(`${INDEXNOW_KEY}.txt is missing or doesn't hold the IndexNow key`);

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log('✓ internal links, security.txt, titles, headings, alt text and IndexNow key look good');
