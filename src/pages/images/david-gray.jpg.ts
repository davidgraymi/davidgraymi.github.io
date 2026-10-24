import type { APIRoute } from 'astro';
import { headshot } from '~/lib/og';

/** A square headshot at a stable URL, for the schema.org Person image and anyone who needs a photo. */
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await headshot(800, 800)), { headers: { 'Content-Type': 'image/jpeg' } });
