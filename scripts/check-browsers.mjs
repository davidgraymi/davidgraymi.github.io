// Loads every built page in Chromium, Firefox and WebKit (Safari's engine), at a
// desktop and a phone size, and fails on anything a visitor would trip over:
//   - a script error, a console error, or a request that fails or returns 4xx/5xx
//   - a page that scrolls sideways (something wider than the screen)
//   - an image that didn't load, or a page with no <title>
// It also saves screenshots of the main pages to .github/screenshots/browsers/.
//
// Run after `npm run build`:
//   npx playwright-core install chromium firefox webkit   (once)
//   npm run check:browsers                                (all three)
//   npm run check:browsers -- webkit                      (just one)
//   PAGES=/,/about/ npm run check:browsers                (just these pages)
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright-core';

const DIST = path.resolve('dist');
const SHOTS = path.resolve('.github/screenshots/browsers');
const ENGINES = { chromium, firefox, webkit };
const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
// Pages worth a screenshot in every engine; the rest are only checked.
const SCREENSHOT = new Set(['/', '/about/', '/blog/', '/blog/neural-cost/', '/work/', '/work/bindersnap/', '/resume/', '/contact/', '/launch/', '/play/', '/play/wordlet/', '/design-system/', '/404.html']);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.bin': 'application/octet-stream', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.otf': 'font/otf', '.ttf': 'font/ttf',
};

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

async function listPages() {
  const pages = [];
  for await (const file of htmlFiles(DIST)) {
    const rel = '/' + path.relative(DIST, file).split(path.sep).join('/');
    pages.push(rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel);
  }
  return pages.sort();
}

// A static server shaped like GitHub Pages: folders serve index.html, misses get 404.html.
function serve() {
  const server = createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(DIST, url);
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' }).end(body);
    } catch {
      const notFound = await readFile(path.join(DIST, '404.html')).catch(() => 'Not found');
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end(notFound);
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function launch(name) {
  try {
    return await ENGINES[name].launch();
  } catch (err) {
    // Locally, use an installed Google Chrome when Playwright's Chromium isn't downloaded.
    if (name === 'chromium') return chromium.launch({ channel: 'chrome' });
    throw err;
  }
}

async function checkPage(context, base, pagePath) {
  const page = await context.newPage();
  const origin = new URL(base).origin;
  const issues = [];
  page.on('pageerror', (e) => issues.push(`script error: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const at = m.location()?.url ? ` (at ${m.location().url.replace(origin, '')}:${m.location().lineNumber})` : '';
    issues.push(`console error: ${m.text().slice(0, 200)}${at}`);
  });
  page.on('requestfailed', (r) => {
    // A navigation cut short by the page itself (e.g. a redirect) isn't a visitor-facing failure.
    if (r.failure()?.errorText.match(/ABORTED|NS_BINDING_ABORTED|cancelled/i)) return;
    issues.push(`request failed: ${r.url().replace(origin, '')} (${r.failure()?.errorText})`);
  });
  page.on('response', (r) => {
    const expected404 = pagePath === '/404.html' && r.url() === base + pagePath;
    if (r.status() >= 400 && !expected404) issues.push(`HTTP ${r.status()}: ${r.url().replace(origin, '')}`);
  });

  try {
    await page.goto(base + pagePath, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForTimeout(500); // let on-load scripts and animations settle
    const found = await page.evaluate(() => {
      const root = document.documentElement;
      const overflow = root.scrollWidth - root.clientWidth;
      // Name the outermost elements sticking out past the right edge, to point at the culprit.
      const wide = [...document.body.querySelectorAll('*')]
        .filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1 && getComputedStyle(el).position !== 'fixed')
        .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= root.clientWidth + 1)
        .slice(0, 3)
        .map((el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''));
      const brokenImages = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0 && (img.currentSrc || img.src))
        .map((img) => img.currentSrc || img.src);
      return { title: document.title, overflow, wide, brokenImages };
    });
    if (found.overflow > 1) issues.push(`scrolls sideways by ${found.overflow}px${found.wide.length ? ': ' + found.wide.join(', ') : ''}`);
    for (const src of found.brokenImages) issues.push(`image didn't load: ${src.replace(origin, '')}`);
    if (!found.title) issues.push('no <title>');
  } catch (err) {
    issues.push(`didn't load: ${err.message.split('\n')[0]}`);
  }
  return { page, issues: [...new Set(issues)] };
}

const requested = process.argv.slice(2);
const engines = requested.length ? requested : Object.keys(ENGINES);
for (const name of engines) if (!ENGINES[name]) throw new Error(`Unknown browser "${name}". Use: ${Object.keys(ENGINES).join(', ')}`);

const pages = (await listPages()).filter((p) => !process.env.PAGES || process.env.PAGES.split(',').includes(p));
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
let failures = 0;

for (const name of engines) {
  const browser = await launch(name);
  console.log(`\n${name} ${browser.version()}: ${pages.length} pages × ${VIEWPORTS.length} sizes`);
  for (const { name: size, viewport, isMobile, hasTouch } of VIEWPORTS) {
    // Firefox has no mobile emulation; the phone-sized viewport still catches layout problems.
    const mobile = name === 'firefox' ? {} : { isMobile, hasTouch };
    const context = await browser.newContext({ viewport, ...mobile });
    for (const pagePath of pages) {
      const { page, issues } = await checkPage(context, base, pagePath);
      if (SCREENSHOT.has(pagePath) && !issues.some((i) => i.startsWith("didn't load"))) {
        const dir = path.join(SHOTS, name);
        await mkdir(dir, { recursive: true });
        const slug = pagePath === '/' ? 'home' : pagePath.replace(/^\/|\/$/g, '').replace(/[/.]/g, '_');
        await page.screenshot({ path: path.join(dir, `${size}-${slug}.png`) });
      }
      await page.close();
      if (issues.length) {
        failures++;
        console.log(`  ✗ [${size}] ${pagePath}\n      ${issues.join('\n      ')}`);
      }
    }
    await context.close();
  }
  await browser.close();
}

server.close();
if (failures) {
  console.error(`\n${failures} page load(s) had problems.`);
  process.exit(1);
}
console.log(`\nEvery page passed in ${engines.join(', ')}.`);
