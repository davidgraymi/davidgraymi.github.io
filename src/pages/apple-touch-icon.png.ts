import type { APIRoute } from 'astro';
import { renderIcon } from '~/lib/og';

// iOS, iMessage and many link unfurlers request this path directly, whatever the page's <link> tags say.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderIcon(180)), { headers: { 'Content-Type': 'image/png' } });
