// Builds the compact MNIST subset used by the "Draw a digit" game on the
// knn-digits work page.
//
//   node scripts/knn-digits/build-dataset.mjs [cacheDir]
//
// Downloads the MNIST training and test sets (cached in cacheDir, default
// .cache/mnist), picks a class-balanced subset of training digits plus a few
// held-out test digits for the "example" button, quantises every pixel to
// 4 bits and writes public/games/knn-digits/mnist-subset.bin.
//
// File layout (all integers little-endian):
//   0   4  magic "KNN1"
//   4   2  train count T
//   6   2  example count E
//   8   1  width (28)
//   9   1  height (28)
//   10  T  train labels (one byte each)
//   ..  E  example labels
//   ..  (T + E) * 392  pixels, two 4-bit values per byte, high nibble first,
//                      row-major, 0 = background, 15 = full ink
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cacheDir = path.resolve(process.argv[2] ?? path.join(root, '.cache/mnist'));
const outFile = path.join(root, 'public/games/knn-digits/mnist-subset.bin');

const BASE = 'https://storage.googleapis.com/cvdf-datasets/mnist/';
const FILES = [
  'train-images-idx3-ubyte.gz',
  'train-labels-idx1-ubyte.gz',
  't10k-images-idx3-ubyte.gz',
  't10k-labels-idx1-ubyte.gz',
];

const PER_CLASS = 75; // 750 digits * 392 B ~= 294 KB
const EXAMPLES_PER_CLASS = 3;
const SIDE = 28;
const PIXELS = SIDE * SIDE;

async function load(name) {
  const cached = path.join(cacheDir, name);
  let gz;
  try {
    gz = await readFile(cached);
  } catch {
    console.log(`downloading ${name}`);
    const res = await fetch(BASE + name);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    gz = Buffer.from(await res.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cached, gz);
  }
  return gunzipSync(gz);
}

function parseImages(buf) {
  if (buf.readUInt32BE(0) !== 2051) throw new Error('bad image file');
  const n = buf.readUInt32BE(4);
  return { n, at: (i) => buf.subarray(16 + i * PIXELS, 16 + (i + 1) * PIXELS) };
}

function parseLabels(buf) {
  if (buf.readUInt32BE(0) !== 2049) throw new Error('bad label file');
  return buf.subarray(8);
}

// Deterministic PRNG so rebuilding gives the same file.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, rand) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBalanced(labels, perClass, rand) {
  const byClass = Array.from({ length: 10 }, () => []);
  labels.forEach((l, i) => byClass[l].push(i));
  return byClass.flatMap((idx) => shuffled(idx, rand).slice(0, perClass));
}

// Same rule as the browser: Euclidean distance on 4-bit pixels, each of the
// k neighbours votes 1 / (1 + distance).
function classify(train, query, k) {
  const best = [];
  for (const t of train) {
    let d = 0;
    for (let p = 0; p < PIXELS; p++) {
      const diff = t.px[p] - query[p];
      d += diff * diff;
    }
    if (best.length < k || d < best[best.length - 1].d) {
      best.push({ d, label: t.label });
      best.sort((a, b) => a.d - b.d);
      if (best.length > k) best.pop();
    }
  }
  const votes = new Float64Array(10);
  for (const b of best) votes[b.label] += 1 / (1 + Math.sqrt(b.d));
  return votes.indexOf(Math.max(...votes));
}

const [trainImgBuf, trainLblBuf, testImgBuf, testLblBuf] = await Promise.all(FILES.map(load));
const trainImgs = parseImages(trainImgBuf);
const trainLbls = parseLabels(trainLblBuf);
const testImgs = parseImages(testImgBuf);
const testLbls = parseLabels(testLblBuf);

const rand = mulberry32(38);
const trainIdx = pickBalanced(Array.from(trainLbls), PER_CLASS, rand);
const exampleIdx = pickBalanced(Array.from(testLbls), EXAMPLES_PER_CLASS, rand);

const quant = (img) => Uint8Array.from(img, (v) => Math.round((v / 255) * 15));
const train = trainIdx.map((i) => ({ label: trainLbls[i], px: quant(trainImgs.at(i)) }));
const examples = exampleIdx.map((i) => ({ label: testLbls[i], px: quant(testImgs.at(i)) }));

const all = [...train, ...examples];
const header = Buffer.alloc(10);
header.write('KNN1', 0, 'ascii');
header.writeUInt16LE(train.length, 4);
header.writeUInt16LE(examples.length, 6);
header.writeUInt8(SIDE, 8);
header.writeUInt8(SIDE, 9);
const labels = Buffer.from(all.map((s) => s.label));
const pixels = Buffer.alloc((all.length * PIXELS) / 2);
all.forEach((s, n) => {
  for (let p = 0; p < PIXELS; p += 2) pixels[(n * PIXELS + p) / 2] = (s.px[p] << 4) | s.px[p + 1];
});

const out = Buffer.concat([header, labels, pixels]);
await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, out);
console.log(
  `wrote ${path.relative(root, outFile)}: ${train.length} train + ${examples.length} examples, ` +
    `${(out.length / 1024).toFixed(1)} KB, sha256 ${createHash('sha256').update(out).digest('hex').slice(0, 12)}`,
);

// Sanity check: accuracy on 1000 MNIST test digits the game never shows.
const exampleSet = new Set(exampleIdx);
const evalIdx = shuffled(
  Array.from({ length: testImgs.n }, (_, i) => i).filter((i) => !exampleSet.has(i)),
  mulberry32(7),
).slice(0, 1000);
for (const k of [1, 3, 5, 7, 9]) {
  let correct = 0;
  for (const i of evalIdx) if (classify(train, quant(testImgs.at(i)), k) === testLbls[i]) correct++;
  console.log(`k=${k}: ${((correct / evalIdx.length) * 100).toFixed(1)}% on ${evalIdx.length} held-out test digits`);
}
