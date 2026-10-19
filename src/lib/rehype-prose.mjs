// Rehype plugin for long-form content (blog posts, case studies).
//
// Figures — a paragraph holding a single image from /public becomes a <figure>:
//   ![Alt text that states the finding](/images/x.webp "Figure 1 — Caption text")
// - The title becomes the <figcaption>; a leading "Figure N" is set as a label.
// - If /public/images/x-dark.webp exists it is shown instead in dark mode.
// - Width/height come from the file so the page doesn't shift; images lazy-load.
// - Each image links to its full-size file so it can be zoomed on a phone.
//
// Tables — wrapped in a focusable scroll region so wide tables never widen the
// page, and columns whose body cells are all numbers are right-aligned.

import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');

// "0.082 ms", "**1.79×**", "~0.3 ms (GPU overhead)", "24.8%", "3.60 TFLOP/s", "—"
const NUMERIC =
  /^(?:[~≈<>]\s*)?[-+]?\d[\d,]*(?:\.\d+)?\s*(?:ms|%|×|GB\/s|[GT]FLOP\/s|FLOP\/byte|k)?(?:\s*\(.*\))?$|^[—–-]$/;

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

function toText(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(toText).join('');
}

function isBlank(node) {
  return node.type === 'text' && node.value.trim() === '';
}

function publicFile(src) {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return null;
  const file = path.join(PUBLIC_DIR, decodeURIComponent(src.split(/[?#]/)[0]));
  return file.startsWith(PUBLIC_DIR) && existsSync(file) ? file : null;
}

function darkVariant(src) {
  const dark = src.replace(/(\.[a-z0-9]+)$/i, '-dark$1');
  return dark !== src && publicFile(dark) ? dark : null;
}

async function sized(src) {
  const { width, height } = await sharp(publicFile(src)).metadata();
  return { width, height };
}

function caption(title) {
  const match = /^(Figure\s+\d+)\s*[.:—–-]\s*(.*)$/s.exec(title);
  if (!match) return el('figcaption', {}, [text(title)]);
  return el('figcaption', {}, [el('span', { className: ['figure-label'] }, [text(match[1])]), text(` ${match[2]}`)]);
}

async function figure(img) {
  const { src, alt = '', title } = img.properties;
  const dark = darkVariant(src);
  const variants = dark ? [[src, 'fig-light'], [dark, 'fig-dark']] : [[src, null]];

  const links = await Promise.all(
    variants.map(async ([href, cls]) =>
      // The image's alt text names the link; the target is the same image at full size.
      el('a', { href, className: cls ? [cls] : undefined }, [
        el('img', { src: href, alt, ...(await sized(href)), loading: 'lazy', decoding: 'async' }),
      ]),
    ),
  );

  return el('figure', { className: ['prose-figure'] }, [
    el('div', { className: ['prose-figure-media'] }, links),
    ...(title ? [caption(String(title))] : []),
  ]);
}

// "0.062 ms" never splits across lines, but a trailing "(PyTorch eager)" may wrap.
function keepUnits(node) {
  if (node.type === 'text') node.value = node.value.replace(/(\d)\s+(?=ms\b|GB\/s|[GT]?FLOP)/g, '$1\u00a0');
  else for (const child of node.children ?? []) keepUnits(child);
}

function numericColumns(table) {
  const rows = [];
  (function collect(node, inBody) {
    for (const child of node.children ?? []) {
      if (child.type !== 'element') continue;
      if (child.tagName === 'tr') rows.push({ row: child, body: inBody });
      else collect(child, inBody || child.tagName === 'tbody');
    }
  })(table, false);

  const cells = (row) => row.children.filter((c) => c.type === 'element' && (c.tagName === 'td' || c.tagName === 'th'));
  const bodyRows = rows.filter((r) => r.body).map((r) => cells(r.row));
  if (bodyRows.length === 0) return;

  const width = Math.max(...bodyRows.map((r) => r.length));
  for (let col = 1; col < width; col++) {
    const values = bodyRows.map((r) => (r[col] ? toText(r[col]).trim() : ''));
    if (!values.every((v) => NUMERIC.test(v)) || values.every((v) => /^[—–-]$/.test(v))) continue;
    for (const { row } of rows) {
      const cell = cells(row)[col];
      if (!cell) continue;
      cell.properties.className = [...(cell.properties.className ?? []), 'num'];
      keepUnits(cell);
    }
  }
}

export default function rehypeProse() {
  return async (tree) => {
    const pending = [];

    (function walk(node) {
      const children = node.children ?? [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== 'element') continue;

        if (child.tagName === 'p') {
          const content = child.children.filter((c) => !isBlank(c));
          const img = content[0];
          if (content.length === 1 && img.type === 'element' && img.tagName === 'img' && publicFile(img.properties.src)) {
            pending.push(figure(img).then((fig) => (children[i] = fig)));
            continue;
          }
        }

        if (child.tagName === 'table') {
          numericColumns(child);
          children[i] = el('div', { className: ['table-scroll'], tabIndex: 0, role: 'region', 'aria-label': 'Scrollable table' }, [child]);
          continue;
        }

        walk(child);
      }
    })(tree);

    await Promise.all(pending);
  };
}
