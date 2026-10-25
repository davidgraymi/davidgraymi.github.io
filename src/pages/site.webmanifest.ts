import type { APIRoute } from 'astro';
import { site } from '~/site.config';

/** Name, colours and icons for "Add to Home Screen" on Android and Chrome. */
export const GET: APIRoute = () =>
  Response.json({
    name: site.name,
    short_name: site.shortName,
    description: site.tagline,
    start_url: '/',
    display: 'browser',
    background_color: '#06090e',
    theme_color: '#06090e',
    icons: [
      { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Full-bleed amber with the mark well inside the safe circle, so it doubles as maskable.
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  });
