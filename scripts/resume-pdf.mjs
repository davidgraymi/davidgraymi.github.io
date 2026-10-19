// Prints /resume to public/files/David-Gray-Resume.pdf.
// Run after `npm run build`: npm run resume:pdf
// Uses a local Chrome (or CHROME_PATH) through playwright-core, so nothing is downloaded.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
const OUT = 'public/files/David-Gray-Resume.pdf';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };

// Just enough static server for one page and its assets.
const server = createServer(async (req, res) => {
  let file;
  try {
    file = path.resolve(DIST, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  } catch {
    return res.writeHead(400).end();
  }
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return res.writeHead(403).end();
  if (!path.extname(file)) file = path.join(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/resume`;

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' },
);
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.pdf({ path: OUT, format: 'Letter', printBackground: true, preferCSSPageSize: true });
  console.log(`Wrote ${OUT}`);
} finally {
  await browser.close();
  server.close();
}
