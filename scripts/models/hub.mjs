#!/usr/bin/env node
// Keeps the games' trained artifacts in step with their Hugging Face repos.
//
//   npm run models -- verify             local files match models.lock.json (no network)
//   npm run models -- publish [id...]    upload artifact + model card, record the commit
//   npm run models -- pull [id...]       download the locked revision, check its hash
//
// publish needs HF_TOKEN (a write token from huggingface.co/settings/tokens).
// The models and their cards are described in models.mjs.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRepo, downloadFile, repoExists, uploadFiles } from '@huggingface/hub';
import { modelCard, models, namespace } from './models.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const lockFile = path.join(here, 'models.lock.json');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const readLock = async () => JSON.parse(await readFile(lockFile, 'utf8').catch(() => '{}'));
const writeLock = (lock) => writeFile(lockFile, JSON.stringify(lock, null, 2) + '\n');
const repoName = (m) => `${namespace}/${m.id}`;

const [command, ...ids] = process.argv.slice(2);
const selected = ids.length ? models.filter((m) => ids.includes(m.id)) : models;
if (ids.length && selected.length !== ids.length) {
  console.error(`Unknown model id. Known: ${models.map((m) => m.id).join(', ')}`);
  process.exit(1);
}

async function verify() {
  const lock = await readLock();
  let bad = 0;
  for (const m of selected) {
    for (const f of m.files) {
      const want = lock[m.id]?.files?.[f.path];
      const have = sha256(await readFile(path.join(root, f.local)));
      if (!want) {
        console.log(`?  ${f.local}: not in models.lock.json yet (run publish)`);
      } else if (want !== have) {
        console.log(`✗  ${f.local}: differs from models.lock.json (${lock[m.id].repo})`);
        bad++;
      } else {
        const rev = lock[m.id].revision ? `@${lock[m.id].revision.slice(0, 8)}` : '(not yet on the Hub)';
        console.log(`✓  ${f.local} ${rev}`);
      }
    }
  }
  if (bad) {
    console.error('\nRetrained? Publish the new version: npm run models -- publish');
    process.exit(1);
  }
}

async function publish() {
  const accessToken = process.env.HF_TOKEN;
  if (!accessToken) throw new Error('publish needs HF_TOKEN set to a Hugging Face write token');
  const lock = await readLock();
  for (const m of selected) {
    const repo = { type: 'model', name: repoName(m) };
    if (!(await repoExists({ repo, accessToken }))) {
      await createRepo({ repo, accessToken, visibility: 'public' });
      console.log(`created ${repo.name}`);
    }
    const hashes = {};
    const files = [{ path: 'README.md', content: new Blob([modelCard(m)]) }];
    for (const f of m.files) {
      const buf = await readFile(path.join(root, f.local));
      hashes[f.path] = sha256(buf);
      files.push({ path: f.path, content: new Blob([buf]) });
    }
    const out = await uploadFiles({ repo, accessToken, files, commitTitle: `Publish ${m.id} from davidmgray.com` });
    const revision = out?.commit.oid ?? lock[m.id]?.revision ?? null;
    lock[m.id] = { repo: repo.name, revision, files: hashes };
    console.log(`✓  ${repo.name}@${revision?.slice(0, 8)}  https://huggingface.co/${repo.name}`);
  }
  await writeLock(lock);
}

async function pull() {
  const lock = await readLock();
  for (const m of selected) {
    const entry = lock[m.id];
    if (!entry?.revision) throw new Error(`${m.id} has no published revision in models.lock.json`);
    for (const f of m.files) {
      const blob = await downloadFile({ repo: { type: 'model', name: entry.repo }, path: f.path, revision: entry.revision });
      if (!blob) throw new Error(`${entry.repo}/${f.path} not found at ${entry.revision}`);
      const buf = Buffer.from(await blob.arrayBuffer());
      if (sha256(buf) !== entry.files[f.path]) throw new Error(`${entry.repo}/${f.path}: hash does not match models.lock.json`);
      await writeFile(path.join(root, f.local), buf);
      console.log(`✓  ${f.local} ← ${entry.repo}@${entry.revision.slice(0, 8)}`);
    }
  }
}

const commands = { verify, publish, pull };
if (!commands[command]) {
  console.error('usage: npm run models -- <verify|publish|pull> [model-id...]');
  process.exit(1);
}
await commands[command]();
