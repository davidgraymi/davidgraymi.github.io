#!/usr/bin/env node
// Trains an ID3 decision tree on the UCI Mushroom dataset (Schlimmer, 1987) and
// writes the compact tree plus a sample of real specimens for the
// "Is it poisonous?" game on /work/id3-mushrooms.
//
//   node scripts/id3-mushrooms/train.mjs                 # downloads the dataset
//   node scripts/id3-mushrooms/train.mjs path/to/agaricus-lepiota.data
//
// Output: src/lib/games/is-it-poisonous/model.json (committed; the site never
// fetches the dataset at build time).
//
// Plain ID3: split on the attribute with the highest information gain, recurse
// until a node is pure or attributes run out. '?' (missing stalk-root) is kept
// as its own value, the way the original coursework treated it.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_URL = 'https://archive.ics.uci.edu/ml/machine-learning-databases/mushroom/agaricus-lepiota.data';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/lib/games/is-it-poisonous/model.json');

// Attribute names and value codes from agaricus-lepiota.names.
const ATTRIBUTES = [
  ['cap-shape', { b: 'bell', c: 'conical', x: 'convex', f: 'flat', k: 'knobbed', s: 'sunken' }],
  ['cap-surface', { f: 'fibrous', g: 'grooves', y: 'scaly', s: 'smooth' }],
  ['cap-color', { n: 'brown', b: 'buff', c: 'cinnamon', g: 'gray', r: 'green', p: 'pink', u: 'purple', e: 'red', w: 'white', y: 'yellow' }],
  ['bruises', { t: 'yes', f: 'no' }],
  ['odor', { a: 'almond', l: 'anise', c: 'creosote', y: 'fishy', f: 'foul', m: 'musty', n: 'none', p: 'pungent', s: 'spicy' }],
  ['gill-attachment', { a: 'attached', d: 'descending', f: 'free', n: 'notched' }],
  ['gill-spacing', { c: 'close', w: 'crowded', d: 'distant' }],
  ['gill-size', { b: 'broad', n: 'narrow' }],
  ['gill-color', { k: 'black', n: 'brown', b: 'buff', h: 'chocolate', g: 'gray', r: 'green', o: 'orange', p: 'pink', u: 'purple', e: 'red', w: 'white', y: 'yellow' }],
  ['stalk-shape', { e: 'enlarging', t: 'tapering' }],
  ['stalk-root', { b: 'bulbous', c: 'club', u: 'cup', e: 'equal', z: 'rhizomorphs', r: 'rooted', '?': 'unknown' }],
  ['stalk-surface-above-ring', { f: 'fibrous', y: 'scaly', k: 'silky', s: 'smooth' }],
  ['stalk-surface-below-ring', { f: 'fibrous', y: 'scaly', k: 'silky', s: 'smooth' }],
  ['stalk-color-above-ring', { n: 'brown', b: 'buff', c: 'cinnamon', g: 'gray', o: 'orange', p: 'pink', e: 'red', w: 'white', y: 'yellow' }],
  ['stalk-color-below-ring', { n: 'brown', b: 'buff', c: 'cinnamon', g: 'gray', o: 'orange', p: 'pink', e: 'red', w: 'white', y: 'yellow' }],
  ['veil-type', { p: 'partial', u: 'universal' }],
  ['veil-color', { n: 'brown', o: 'orange', w: 'white', y: 'yellow' }],
  ['ring-number', { n: 'none', o: 'one', t: 'two' }],
  ['ring-type', { c: 'cobwebby', e: 'evanescent', f: 'flaring', l: 'large', n: 'none', p: 'pendant', s: 'sheathing', z: 'zone' }],
  ['spore-print-color', { k: 'black', n: 'brown', b: 'buff', h: 'chocolate', r: 'green', o: 'orange', u: 'purple', w: 'white', y: 'yellow' }],
  ['population', { a: 'abundant', c: 'clustered', n: 'numerous', s: 'scattered', v: 'several', y: 'solitary' }],
  ['habitat', { g: 'grasses', l: 'leaves', m: 'meadows', p: 'paths', u: 'urban', w: 'waste', d: 'woods' }],
];

async function loadRows() {
  const path = process.argv[2];
  const text = path ? await readFile(path, 'utf8') : await (await fetch(DATA_URL)).text();
  return text
    .trim()
    .split('\n')
    .map((line) => line.trim().split(','))
    .filter((r) => r.length === 23)
    .map(([label, ...x]) => ({ label, x }));
}

const entropy = (rows) => {
  if (!rows.length) return 0;
  const p = rows.filter((r) => r.label === 'p').length / rows.length;
  return [p, 1 - p].reduce((h, q) => (q > 0 ? h - q * Math.log2(q) : h), 0);
};

const groupBy = (rows, a) => {
  const g = new Map();
  for (const r of rows) (g.get(r.x[a]) ?? g.set(r.x[a], []).get(r.x[a])).push(r);
  return g;
};

const majority = (rows) => (rows.filter((r) => r.label === 'p').length * 2 > rows.length ? 'p' : 'e');

// Node shapes (compact, for the client):
//   leaf:  { l: 'e' | 'p', n }                    n = training samples reaching it
//   split: { a: attrIndex, n, d: default, b: { valueCode: node, ... } }
function id3(rows, attrs) {
  const n = rows.length;
  const h = entropy(rows);
  if (h === 0 || attrs.length === 0) return { l: majority(rows), n };
  let best = -1;
  let bestGain = -Infinity;
  for (const a of attrs) {
    let rem = 0;
    for (const sub of groupBy(rows, a).values()) rem += (sub.length / n) * entropy(sub);
    if (h - rem > bestGain + 1e-12) {
      bestGain = h - rem;
      best = a;
    }
  }
  const rest = attrs.filter((a) => a !== best);
  const b = {};
  const groups = [...groupBy(rows, best).entries()].sort((x, y) => y[1].length - x[1].length);
  for (const [v, sub] of groups) b[v] = id3(sub, rest);
  return { a: best, n, g: Number(bestGain.toFixed(4)), d: majority(rows), b };
}

function classify(node, x) {
  while (!node.l) node = node.b[x[node.a]] ?? { l: node.d };
  return node.l;
}

function leafPath(node, x) {
  const path = [];
  while (!node.l) {
    path.push(x[node.a]);
    node = node.b[x[node.a]];
    if (!node) break;
  }
  return path.join('/');
}

// Deterministic PRNG so re-running produces the same sample.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick a sample that covers every leaf, then fills up with an even mix of
// "easy" (odor gives it away) and "hard" (odorless) specimens.
function sample(rows, tree, size, rand) {
  const unique = [...new Map(rows.map((r) => [r.x.join(''), r])).values()];
  const shuffled = unique
    .map((r) => [rand(), r])
    .sort((a, b) => a[0] - b[0])
    .map(([, r]) => r);
  const picked = new Set();
  const byLeaf = new Map();
  for (const r of shuffled) {
    const k = leafPath(tree, r.x);
    if (!byLeaf.has(k)) byLeaf.set(k, []);
    byLeaf.get(k).push(r);
  }
  for (const list of byLeaf.values()) list.slice(0, 2).forEach((r) => picked.add(r));
  const odorIdx = ATTRIBUTES.findIndex(([name]) => name === 'odor');
  const hard = shuffled.filter((r) => r.x[odorIdx] === 'n' && !picked.has(r));
  const easy = shuffled.filter((r) => r.x[odorIdx] !== 'n' && !picked.has(r));
  while (picked.size < size && (hard.length || easy.length)) {
    const src = (picked.size % 2 === 0 && hard.length) || !easy.length ? hard : easy;
    picked.add(src.shift());
  }
  return [...picked];
}

const rows = await loadRows();
const tree = id3(rows, ATTRIBUTES.map((_, i) => i));
const wrong = rows.filter((r) => classify(tree, r.x) !== r.label).length;
const specimens = sample(rows, tree, 160, mulberry32(40)).map((r) => r.label + r.x.join(''));

const countNodes = (n) => (n.l ? [0, 1] : Object.values(n.b).map(countNodes).reduce((s, c) => [s[0] + c[0], s[1] + c[1]], [1, 0]));
const [splits, leaves] = countNodes(tree);

const model = {
  source: 'UCI Machine Learning Repository: Mushroom (agaricus-lepiota), 8124 specimens',
  trainedOn: rows.length,
  trainingErrors: wrong,
  attributes: ATTRIBUTES.map(([name, values]) => ({ name, values })),
  tree,
  // Each specimen: label char followed by the 22 attribute value codes.
  specimens,
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(model) + '\n');
console.log(`rows=${rows.length} splits=${splits} leaves=${leaves} training errors=${wrong} specimens=${specimens.length}`);
console.log(`wrote ${OUT}`);
