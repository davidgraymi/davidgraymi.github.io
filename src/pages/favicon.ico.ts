import type { APIRoute } from 'astro';
import { renderIcon } from '~/lib/og';

/**
 * Crawlers and chat apps (Slack, Google's result favicons, old browsers) fetch /favicon.ico
 * without reading the page. An .ico can hold a PNG as-is, so this is a 6-byte header,
 * one 16-byte directory entry, and the 48px PNG.
 */
export const GET: APIRoute = async () => {
  const png = await renderIcon(48);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(48, 6); // width
  head.writeUInt8(48, 7); // height
  head.writeUInt16LE(1, 10); // colour planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // offset of the PNG
  return new Response(new Uint8Array(Buffer.concat([head, png])), { headers: { 'Content-Type': 'image/x-icon' } });
};
