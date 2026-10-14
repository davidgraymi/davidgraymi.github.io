import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve('.github/screenshots');
mkdirSync(OUT_DIR, { recursive: true });

async function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not start in time.`);
}

async function main() {
  console.log('Starting Astro preview server...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4321'], {
    stdio: 'inherit',
  });

  const stopServer = () => {
    try {
      server.kill('SIGTERM');
    } catch (e) {}
  };

  process.on('exit', stopServer);
  process.on('SIGINT', stopServer);

  await waitForServer('http://localhost:4321');
  console.log('Preview server ready at http://localhost:4321');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();

    // 1. Home - Dark Desktop
    console.log('Capturing Home (Dark Desktop)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '01-home-dark.png') });

    // 2. Home - Light Desktop
    console.log('Capturing Home (Light Desktop)...');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('theme', 'light');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '02-home-light.png') });

    // 3. Home - Mobile Dark
    console.log('Capturing Home (Mobile Dark)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '03-home-mobile-dark.png') });

    // 4. Work Grid - Desktop Dark
    console.log('Capturing Work Portfolio (Desktop Dark)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4321/work', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '04-work-portfolio-dark.png') });

    // 5. Work Detail - Desktop Dark
    console.log('Capturing Project Detail (Desktop Dark)...');
    await page.goto('http://localhost:4321/work/real-time-processor', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '05-project-detail-dark.png') });

    // 6. Command Palette - Desktop Dark
    console.log('Capturing Command Palette (Desktop Dark)...');
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
      if (typeof window.openCommandPalette === 'function') {
        window.openCommandPalette();
      }
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '06-command-palette-dark.png') });

    // 7. About - Desktop Dark
    console.log('Capturing About Page (Desktop Dark)...');
    await page.goto('http://localhost:4321/about', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('theme', 'dark');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '07-about-page-dark.png') });

    console.log('All screenshots captured successfully!');
  } finally {
    await browser.close();
    stopServer();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
