import type { APIRoute, GetStaticPaths } from 'astro';
import { renderIcon } from '~/lib/og';

/** Home-screen icons for Android and Chrome, listed in site.webmanifest. */
export const getStaticPaths = (() => [192, 512].map((size) => ({ params: { size: String(size) } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(new Uint8Array(await renderIcon(Number(params.size))), { headers: { 'Content-Type': 'image/png' } });
