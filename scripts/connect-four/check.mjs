// Checks the TypeScript port of the Connect Four thinking model against PyTorch.
//
//   node scripts/connect-four/check.mjs
//
// reference.json holds per-step outputs from the original model (fp16 weights,
// CPU) for the empty board and three tactical-set positions, written by
// scripts/connect-four/export.py. Fails if any policy, value, column-class or
// stop logit is off by more than 2e-3, or if the chosen move differs.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'node_modules/.cache/connect-four-model.mjs');
await build({ entryPoints: [path.join(root, 'src/lib/games/connect-four/model.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const { parseWeights, ThinkingModel } = await import(pathToFileURL(out).href);

const buf = await readFile(path.join(root, 'public/games/connect-four/weights.f16.bin'));
const model = new ThinkingModel(parseWeights(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
const ref = JSON.parse(await readFile(path.join(root, 'scripts/connect-four/reference.json'), 'utf8'));

const softmax = (v) => { const m = Math.max(...v); const e = v.map((x) => Math.exp(x - m)); const s = e.reduce((a, b) => a + b); return e.map((x) => x / s); };
let worst = 0, failed = false;
const t0 = performance.now();
let steps = 0;
ref.tokens.forEach((tokens, b) => {
  const outs = [...model.think(tokens, 24)];
  steps += outs.length;
  // halting step in the reference
  let survive = 1, stop = 24;
  for (let k = 0; k < 24; k++) { const lam = k === 23 ? 1 : 1 / (1 + Math.exp(-ref.q[b][k])); survive *= 1 - lam; if (1 - survive >= 0.5) { stop = k + 1; break; } }
  if (outs.length !== stop) { console.error(`position ${b}: stopped at ${outs.length}, reference ${stop}`); failed = true; }
  outs.forEach((o, k) => {
    const refPol = softmax(ref.policy[b][k]);
    const refVal = softmax(ref.value[b][k]);
    const diffs = [
      ...o.policy.map((p, i) => Math.abs(p - refPol[i])),
      ...o.value.map((p, i) => Math.abs(p - refVal[i])),
      ...o.cols.flatMap((c, i) => (c.length ? c.map((p, j) => Math.abs(p - softmax(ref.cols[b][k][i])[j])) : [])),
    ];
    worst = Math.max(worst, ...diffs);
  });
  const last = outs.at(-1);
  const mine = last.policy.indexOf(Math.max(...last.policy));
  const theirs = ref.policy[b][stop - 1].indexOf(Math.max(...ref.policy[b][stop - 1]));
  console.log(`position ${b}: stop step ${outs.length}, move ${mine} (reference ${theirs})`);
  if (mine !== theirs) failed = true;
});
const ms = performance.now() - t0;
console.log(`largest probability difference ${worst.toExponential(2)}; ${(ms / steps).toFixed(1)} ms per outer step`);
if (failed || worst > 2e-3) { console.error('FAIL'); process.exit(1); }
console.log('OK');
