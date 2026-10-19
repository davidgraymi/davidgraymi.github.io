// Post-build checks on dist/ that astro check can't do:
//   1. every internal href/src resolves to a built file (and #fragments to an id)
//   2. security.txt hasn't expired, and won't within 30 days
// Run after `npm run build`: npm run check:site
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
const problems = [];

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === path.join(DIST, 'wordlet')) continue; // Flutter build, not ours to lint
      yield* htmlFiles(full);
    } else if (entry.name.endsWith('.html')) yield full;
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

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log('✓ internal links and security.txt look good');
