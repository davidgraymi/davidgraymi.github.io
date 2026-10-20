// The trained artifacts the games run, and where each one lives on the
// Hugging Face Hub. `npm run models -- publish` pushes them there with a model
// card; `npm run models -- pull` fetches the pinned revisions back.
//
// The site still serves its own copies (they're 2–300 KB and bundled or
// same-origin), so the Hub is the canonical, versioned home, not a runtime
// dependency. See docs/ml-runtime.md for why.

/** Hub user or org that owns the repos. Override with HF_NAMESPACE. */
export const namespace = process.env.HF_NAMESPACE ?? 'davidgraymi';

const site = 'https://davidmgray.com';

export const models = [
  {
    id: 'tetris-value-net',
    title: 'Tetris DQN value network',
    files: [{ local: 'src/lib/games/tetris/weights.json', path: 'weights.json' }],
    card: {
      license: 'unknown',
      tags: ['reinforcement-learning', 'dqn', 'tetris', 'keras'],
      summary:
        'A 4 → 32 → 32 → 1 ReLU value network trained with deep Q-learning to play Tetris. For every legal placement of the current piece it scores the resulting board from four features (lines cleared, holes, bumpiness, aggregate height); the agent takes the highest-scoring placement.',
      format:
        '`weights.json` holds the dense layers exported verbatim from the Keras checkpoint `tetris-nn_4-8.h5`: `layers[i].w` is `[out][in]`, `layers[i].b` is `[out]`. Hidden layers use ReLU, the output is linear.',
      training: 'Trained offline in Python (Keras) on a 10×20 well with the seven standard tetrominoes. See the write-up for the reward shaping.',
      play: `${site}/play/beat-the-bot`,
      story: `${site}/work/tetris-rl`,
    },
  },
  {
    id: 'id3-mushrooms',
    title: 'ID3 decision tree for the UCI Mushroom dataset',
    files: [{ local: 'src/lib/games/is-it-poisonous/model.json', path: 'model.json' }],
    card: {
      license: 'unknown',
      datasets: ['uci-mushroom'],
      tags: ['decision-tree', 'id3', 'tabular-classification'],
      summary:
        'A plain ID3 decision tree (information-gain splits, no pruning) that classifies mushrooms as edible or poisonous from 22 categorical attributes. It reaches zero training error on all 8,124 specimens.',
      format:
        '`model.json` is a compact tree: a leaf is `{ l: "e" | "p", n }`, a split is `{ a: attributeIndex, n, g: gainBits, d: majorityLabel, b: { valueCode: child } }`. `attributes` maps value codes to names, and `specimens` is a sample of real rows for the game.',
      training: 'Regenerate with `node scripts/id3-mushrooms/train.mjs` in the site repo. Data: Schlimmer (1987), UCI Machine Learning Repository, CC BY 4.0.',
      play: `${site}/play/is-it-poisonous`,
      story: `${site}/work/id3-mushrooms`,
    },
  },
  {
    id: 'knn-mnist-subset',
    title: 'Weighted-KNN digit classifier (MNIST subset)',
    files: [{ local: 'public/games/knn-digits/mnist-subset.bin', path: 'mnist-subset.bin' }],
    card: {
      license: 'cc-by-sa-3.0',
      datasets: ['ylecun/mnist'],
      tags: ['knn', 'image-classification', 'mnist'],
      summary:
        'A KNN classifier is its training set, so this is that set: 750 class-balanced MNIST training digits (75 per class) plus 30 held-out test digits, quantised to 4 bits per pixel. Classification is weighted KNN over Euclidean pixel distance, each neighbour voting 1 / (1 + distance).',
      format:
        'Little-endian binary: magic `KNN1`, uint16 train count, uint16 example count, uint8 width and height (28), one label byte per digit, then 392 bytes per digit (two 4-bit pixels per byte, high nibble first, row-major, 0 = background, 15 = full ink).',
      training: 'Regenerate with `node scripts/knn-digits/build-dataset.mjs` in the site repo.',
      play: `${site}/play/draw-a-digit`,
      story: `${site}/work/knn-digits`,
    },
  },
];

/** The model card (README.md) published alongside each artifact. */
export function modelCard(model) {
  const { card } = model;
  const yaml = [
    '---',
    `license: ${card.license}`,
    ...(card.datasets ? ['datasets:', ...card.datasets.map((d) => `  - ${d}`)] : []),
    'tags:',
    ...card.tags.map((t) => `  - ${t}`),
    '---',
  ];
  return [
    ...yaml,
    '',
    `# ${model.title}`,
    '',
    card.summary,
    '',
    `**Play against it:** ${card.play}  `,
    `**How it was built:** ${card.story}`,
    '',
    '## Files',
    '',
    card.format,
    '',
    '## Training',
    '',
    card.training,
    '',
    '## Inference',
    '',
    'No framework needed. The site runs this model in a few lines of plain TypeScript in the browser; the source is linked from the write-up above.',
    '',
  ].join('\n');
}
