// IndexNow (https://www.indexnow.org): tell Bing, Yandex, Naver, Seznam and Yep
// which pages changed, so they recrawl them without waiting for the sitemap.
//
//   node scripts/indexnow.mjs diff <out.txt>   after `npm run build`, before deploy
//   node scripts/indexnow.mjs submit <in.txt>  after the deploy is live
//
// `diff` hashes each sitemap page's content into dist/indexnow-manifest.json,
// compares it with the manifest on the live site, and writes the URLs that were
// added, changed or removed. With no live manifest (first run) every URL counts.
// The key file lives in public/ so search engines can verify we own the host.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const INDEXNOW_KEY = '8a553f364d194bbdafc1cceacae6d270';
const SITE = 'https://davidmgray.com';
const DIST = path.resolve('dist');
const MANIFEST = 'indexnow-manifest.json';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Hash what a search engine cares about, not build noise like CSS fingerprints. */
function pageHash(html) {
  const pick = (re) => html.match(re)?.[0] ?? '';
  const content = [
    pick(/<title[^>]*>[\s\S]*?<\/title>/),
    pick(/<meta name="description"[^>]*>/),
    pick(/<link rel="canonical"[^>]*>/),
    pick(/<main[\s>][\s\S]*<\/main>/) || pick(/<body[\s>][\s\S]*<\/body>/),
  ]
    .join('\n')
    .replace(/(\/_astro\/[^"'\s]+?)\.[\w-]{8}\./g, '$1.'); // Vite asset hashes
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

async function buildManifest() {
  const sitemap = await readFile(path.join(DIST, 'sitemap-0.xml'), 'utf8');
  const manifest = {};
  for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const file = path.join(DIST, new URL(url).pathname, 'index.html');
    manifest[url] = pageHash(await readFile(file, 'utf8'));
  }
  return manifest;
}

async function liveManifest() {
  try {
    const res = await fetch(`${SITE}/${MANIFEST}`);
    if (res.ok) return await res.json();
    console.warn(`No live ${MANIFEST} (HTTP ${res.status}); submitting every URL.`);
  } catch (err) {
    console.warn(`Couldn't fetch live ${MANIFEST} (${err.message}); submitting every URL.`);
  }
  return {};
}

async function diff(out) {
  const key = await readFile(path.join(DIST, `${INDEXNOW_KEY}.txt`), 'utf8').catch(() => '');
  if (key.trim() !== INDEXNOW_KEY) throw new Error(`dist/${INDEXNOW_KEY}.txt is missing or doesn't hold the key`);

  const next = await buildManifest();
  const prev = await liveManifest();
  await writeFile(path.join(DIST, MANIFEST), JSON.stringify(next, null, 1) + '\n');

  const changed = Object.keys(next).filter((url) => prev[url] !== next[url]);
  const removed = Object.keys(prev).filter((url) => !(url in next)); // engines recrawl and see the 404
  const urls = [...changed, ...removed];
  await writeFile(out, urls.join('\n') + (urls.length ? '\n' : ''));
  console.log(`IndexNow: ${changed.length} new/changed, ${removed.length} removed → ${out}`);
  for (const url of urls) console.log(`  ${url}`);
}

async function submit(input) {
  const urlList = (await readFile(input, 'utf8')).split('\n').filter(Boolean);
  if (!urlList.length) return console.log('IndexNow: nothing changed, nothing to submit.');

  // One request takes up to 10,000 URLs; this site is nowhere near that.
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  // 200 = accepted; 202 = accepted while the key is still being verified.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow rejected the submission: HTTP ${res.status} ${await res.text()}`);
  }
  console.log(`IndexNow: submitted ${urlList.length} URL(s) (HTTP ${res.status}).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, file] = process.argv.slice(2);
  const commands = { diff, submit };
  if (!commands[cmd] || !file) {
    console.error('usage: node scripts/indexnow.mjs <diff|submit> <urls.txt>');
    process.exit(1);
  }
  await commands[cmd](file);
}
