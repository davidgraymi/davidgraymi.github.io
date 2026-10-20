#!/usr/bin/env node
// Captures the card previews on /play: one dark and one light screenshot of
// each game's player, written to src/assets/games/<slug>-<theme>.webp.
//
//   npm run build && npm run games:thumbnails
//
// Serves dist/ itself and drives your local Chrome (set
// CHROME_PATH to use another Chromium). Re-run it when a game's look changes.
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'src/assets/games');
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/opt/pw-browsers/chromium');

// A minimal static server for dist/ (enough for the player pages).
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.bin': 'application/octet-stream' };
const server = createServer(async (req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

const html = await (await fetch(`${BASE}/play`)).text();
const slugs = [...new Set([...html.matchAll(/href="\/play\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 816 }, deviceScaleFactor: 1, colorScheme: theme });
  // Skip the first-visit "How to play" sheet.
  await ctx.addInitScript((all) => all.forEach((s) => localStorage.setItem(`play-seen:/play/${s}`, '1')), slugs);
  const page = await ctx.newPage();
  for (const slug of slugs) {
    await page.goto(`${BASE}/play/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200); // let lazy games mount and draw
    // The stage below the player's bar is 1024x768: what a player sees, at 4:3.
    const shot = await page.locator('.play-stage').screenshot();
    const file = path.join(outDir, `${slug}-${theme}.webp`);
    await sharp(shot).resize({ width: 960, height: 720, fit: 'cover' }).webp({ quality: 78 }).toFile(file);
    console.log(path.relative(root, file));
  }
  await ctx.close();
}
await browser.close();
server.close();
