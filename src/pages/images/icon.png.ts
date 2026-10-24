import type { APIRoute } from 'astro';
import { renderIcon } from '~/lib/og';

// Same URL the old hand-made logo lived at, so existing links keep working.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderIcon()), { headers: { 'Content-Type': 'image/png' } });
