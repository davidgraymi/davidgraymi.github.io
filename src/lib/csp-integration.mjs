import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Adds a Content-Security-Policy <meta> to every built page.
 *
 * GitHub Pages can't send response headers, so a meta tag is the strongest
 * policy available here (it can't carry frame-ancestors or reporting). Scripts
 * are locked to same-origin files plus a SHA-256 hash of each inline script on
 * the page. Styles allow 'unsafe-inline' because Shiki and KaTeX write inline
 * style attributes on every token and glyph; style injection is a far smaller
 * risk than script injection, and Astro's built-in CSP can't relax styles alone.
 */
const policy = (scriptHashes) =>
  [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.map((h) => `'sha256-${h}'`).join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

// Executable inline scripts only: JSON-LD and other data blocks aren't run, so they don't need a hash.
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
const isExecutable = (attrs) => {
  const type = attrs.match(/\btype=["']?([^"'\s>]+)/)?.[1];
  return !type || type === 'module' || type === 'text/javascript';
};

async function* htmlFiles(dir, skip) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skip.includes(full)) yield* htmlFiles(full, skip);
    } else if (entry.name.endsWith('.html')) yield full;
  }
}

/** @param {{ skip?: string[] }} options directories under dist/ to leave alone */
export default function csp({ skip = [] } = {}) {
  return {
    name: 'csp-meta',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        let pages = 0;
        for await (const file of htmlFiles(root, skip.map((s) => path.join(root, s)))) {
          const html = await readFile(file, 'utf8');
          const hashes = [...html.matchAll(INLINE_SCRIPT)]
            .filter(([, attrs]) => isExecutable(attrs))
            .map(([, , body]) => createHash('sha256').update(body).digest('base64'));
          const meta = `<meta http-equiv="Content-Security-Policy" content="${policy([...new Set(hashes)])}">`;
          // First thing in <head>, so the policy covers every script that follows.
          await writeFile(file, html.replace(/<head([^>]*)>/, `<head$1>${meta}`));
          pages++;
        }
        logger.info(`CSP meta added to ${pages} pages`);
      },
    },
  };
}
