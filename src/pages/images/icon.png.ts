import type { APIRoute } from 'astro';
import { renderIcon } from '~/lib/og';

// Same URL the old hand-made logo lived at, so existing links keep working. 180px is iOS's apple-touch-icon size.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderIcon(180)), { headers: { 'Content-Type': 'image/png' } });
