// Share each new blog post on LinkedIn, once, after the deploy that publishes it.
//
//   node scripts/linkedin.mjs diff <out.json>   after `npm run build`, before deploy
//   node scripts/linkedin.mjs post <in.json>    after the deploy is live
//   node scripts/linkedin.mjs auth              on your machine, to get a token
//
// `diff` compares dist/linkedin.json (src/pages/linkedin.json.ts) with the live
// copy and keeps the posts that aren't live yet. Drafts aren't in the file, so
// flipping `draft: false` counts as new. If the live copy can't be read, nothing
// is posted: better to miss one post than to re-share the whole blog.
//
// `post` needs two repository secrets, both printed by `auth`:
//   LINKEDIN_TOKEN   member access token with w_member_social (lasts 60 days)
//   LINKEDIN_AUTHOR  urn:li:person:<id>
// Without them it skips. With an expired token it fails, so the run goes red.
//
// `auth` needs a LinkedIn app (https://www.linkedin.com/developers/apps) with the
// "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" products
// and http://localhost:8723/callback as an authorized redirect URL:
//   LINKEDIN_CLIENT_ID=... LINKEDIN_CLIENT_SECRET=... node scripts/linkedin.mjs auth
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE = 'https://davidmgray.com';
const FEED = 'linkedin.json';
const API = 'https://api.linkedin.com/rest';
// LinkedIn retires API versions about a year after release; bump this when it does.
const VERSION = process.env.LINKEDIN_VERSION || '202609';

async function diff(out) {
  const next = JSON.parse(await readFile(path.resolve('dist', FEED), 'utf8'));
  let live;
  try {
    const res = await fetch(`${SITE}/${FEED}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    live = await res.json();
  } catch (err) {
    console.warn(`LinkedIn: couldn't read the live ${FEED} (${err.message}); sharing nothing this time.`);
    live = next;
  }
  const seen = new Set(live.map((p) => p.url));
  const fresh = next.filter((p) => !seen.has(p.url) && p.text !== false);
  await writeFile(out, JSON.stringify(fresh, null, 1) + '\n');
  console.log(`LinkedIn: ${fresh.length} new post(s) → ${out}`);
  for (const p of fresh) console.log(`  ${p.url}`);
}

/**
 * Post text is LinkedIn's "little text": these characters must be escaped or
 * the post is cut off at the first one. `#word` becomes a real hashtag.
 */
function littleText(text) {
  return text
    .replace(/[\\|{}@[\]()<>#*_~]/g, '\\$&')
    .replace(/\\#(\w+)/g, '{hashtag|\\#|$1}');
}

async function api(method, url, token, body) {
  const res = await fetch(url.startsWith('http') ? url : `${API}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'LinkedIn-Version': VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('LinkedIn token expired or revoked. Run `node scripts/linkedin.mjs auth` and update LINKEDIN_TOKEN.');
  if (!res.ok) throw new Error(`LinkedIn ${method} ${url}: HTTP ${res.status} ${await res.text()}`);
  return res;
}

/** Upload the post's social card. Posts made through the API don't scrape one. */
async function uploadImage(src, author, token) {
  const init = await (
    await api('POST', '/images?action=initializeUpload', token, { initializeUploadRequest: { owner: author } })
  ).json();
  const { uploadUrl, image } = init.value;
  const bytes = await fetch(src).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${src}: HTTP ${r.status}`))));
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: bytes });
  if (!put.ok) throw new Error(`image upload: HTTP ${put.status}`);
  for (let i = 0; i < 15; i++) {
    const { status } = await (await api('GET', `/images/${encodeURIComponent(image)}`, token)).json();
    if (status === 'AVAILABLE') return image;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('image still processing after 30s');
}

async function post(input) {
  const posts = JSON.parse(await readFile(input, 'utf8'));
  if (!posts.length) return console.log('LinkedIn: no new posts.');
  const { LINKEDIN_TOKEN: token, LINKEDIN_AUTHOR: author } = process.env;
  if (!token || !author) {
    console.log(`::notice::LinkedIn secrets aren't set; not sharing ${posts.map((p) => p.url).join(', ')}`);
    return;
  }

  for (const p of posts) {
    let thumbnail;
    try {
      thumbnail = await uploadImage(p.image, author, token);
    } catch (err) {
      if (err.message.includes('expired')) throw err;
      console.warn(`LinkedIn: sharing ${p.url} without a card image (${err.message})`);
    }
    const res = await api('POST', '/posts', token, {
      author,
      commentary: littleText(p.text),
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article: { source: p.url, title: p.title, description: p.description, ...(thumbnail && { thumbnail }) } },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    });
    const urn = res.headers.get('x-restli-id');
    console.log(`LinkedIn: shared ${p.url} → https://www.linkedin.com/feed/update/${urn}/`);
  }
}

async function auth() {
  const { LINKEDIN_CLIENT_ID: id, LINKEDIN_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error('Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET from your LinkedIn app.');
  const redirect = 'http://localhost:8723/callback';
  const state = randomBytes(16).toString('hex');
  const authorize = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authorize.search = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    redirect_uri: redirect,
    state,
    scope: 'openid profile w_member_social',
  });

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, redirect);
      if (url.pathname !== '/callback') return res.writeHead(404).end();
      res.end('Done. You can close this tab.');
      server.close();
      if (url.searchParams.get('state') !== state) reject(new Error('OAuth state mismatch'));
      else if (url.searchParams.get('error')) reject(new Error(url.searchParams.get('error_description')));
      else resolve(url.searchParams.get('code'));
    }).listen(8723);
    console.log(`Open this URL and approve:\n\n  ${authorize}\n`);
  });

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: id, client_secret: secret }),
  });
  if (!tokenRes.ok) throw new Error(`token exchange: HTTP ${tokenRes.status} ${await tokenRes.text()}`);
  const { access_token, expires_in } = await tokenRes.json();
  const me = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${access_token}` } }).then((r) => r.json());

  const expires = new Date(Date.now() + expires_in * 1000).toISOString().slice(0, 10);
  console.log(`Token expires ${expires}. Save both as repository secrets:\n`);
  console.log(`  gh secret set LINKEDIN_TOKEN --body '${access_token}'`);
  console.log(`  gh secret set LINKEDIN_AUTHOR --body 'urn:li:person:${me.sub}'`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, file] = process.argv.slice(2);
  const commands = { diff, post, auth };
  if (!commands[cmd] || (cmd !== 'auth' && !file)) {
    console.error('usage: node scripts/linkedin.mjs <diff|post> <posts.json> | auth');
    process.exit(1);
  }
  await commands[cmd](file);
}
