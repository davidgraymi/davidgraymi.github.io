/**
 * The game catalog: one entry per game on /play. Each one gets a full-screen
 * player at /play/<slug> (src/pages/play/[game].astro maps the slug to its
 * component). The same components also stay embedded in the write-ups.
 *
 * To add a game: write the component in src/components/games/, add an entry
 * here, and map its slug in src/pages/play/[game].astro.
 */
import { rounds } from './bot-or-human';

export interface Game {
  slug: string;
  title: string;
  /** One line for the catalog card and <meta description>. */
  blurb: string;
  /** Shown in the player's "How to play" sheet, one paragraph each. */
  howTo: string[];
  /** Short controls summary for the card, e.g. "Keyboard or touch". */
  controls: string;
  /** Rough length of one round. */
  length: string;
  /** What's on the other side of the board. */
  opponent: string;
  group: 'model' | 'quick';
  /** The write-up the game came from, if any. */
  story?: { label: string; href: string };
  /** Widest the game wants to be in the player. */
  width: 'sm' | 'md' | 'lg' | 'xl';
}

export const groups = {
  model: {
    title: 'Play against the model',
    lead: 'Each of these runs a real model or solver from one of my projects, in your browser, and shows its working.',
  },
  quick: {
    title: 'Quick games',
    lead: 'Small ones. A minute or two each, nothing to install, scores stay in this browser.',
  },
} as const;

export const games: Game[] = [
  {
    slug: 'beat-the-bot',
    title: 'Beat the bot',
    blurb: 'Tetris against the value network from my reinforcement-learning project. Same pieces, two minutes, most lines wins.',
    howTo: [
      'You and the agent get the same pieces in the same order. After two minutes, whoever has cleared more lines wins.',
      'Arrow keys move, ↑ or X rotates, Z rotates back, ↓ soft-drops and Space hard-drops. P pauses. On a phone, use the pad under the boards.',
      "Pick the agent's speed before you start. Speed only changes how fast it moves; it picks the same placements at every speed.",
    ],
    controls: 'Keyboard or touch',
    length: '2 min',
    opponent: 'Neural network',
    group: 'model',
    story: { label: 'Reinforcement Learning applied to Tetris', href: '/work/tetris-rl' },
    width: 'lg',
  },
  {
    slug: 'draw-a-digit',
    title: 'Draw a digit',
    blurb: 'Draw 0–9 and watch a weighted KNN classifier find its nearest MNIST neighbours as you go.',
    howTo: [
      'Draw a single digit in the pad with a mouse, finger or stylus. The classifier updates as you draw and shows the training digits it matched.',
      'Change k to see how many neighbours get a vote. Small k trusts the single closest match; large k lets more distant digits outvote it.',
    ],
    controls: 'Mouse, touch or stylus',
    length: 'As long as you like',
    opponent: 'KNN classifier',
    group: 'model',
    story: { label: 'Handwritten digit recognition with weighted KNN', href: '/work/knn-digits' },
    width: 'lg',
  },
  {
    slug: 'is-it-poisonous',
    title: 'Is it poisonous?',
    blurb: 'A real mushroom from the UCI dataset. Make your call, then watch an ID3 decision tree make its own.',
    howTo: [
      "You get a real specimen's 22 attributes. Decide whether it's edible or poisonous.",
      'Press E or P (or tap a button) to make your call. Then the decision tree lights up the path it took to its verdict; press N for the next specimen.',
      'The tree was trained on all 8,124 specimens and gets every one of them right, so its path tells you which attributes to look at first.',
    ],
    controls: 'Mouse, touch or keyboard',
    length: '30 s a round',
    opponent: 'Decision tree',
    group: 'model',
    story: { label: 'ID3 mushroom classification', href: '/work/id3-mushrooms' },
    width: 'xl',
  },
  {
    slug: 'route-the-robots',
    title: 'Route the robots',
    blurb: 'Draw a warehouse, place robots and goals, and race a LaCAM multi-agent path-finding solver to the shortest plan.',
    howTo: [
      'Build a board with the wall, start and goal tools, or load a preset. Then let the solver plan routes for every robot at once so none collide.',
      'Switch to "Beat the solver" to move the robots yourself with the arrow keys (or the pad) and try to finish in fewer steps.',
    ],
    controls: 'Mouse, touch or keyboard',
    length: '2–5 min',
    opponent: 'Search algorithm',
    group: 'model',
    story: { label: 'LaCam for Multi-Agent Path Finding', href: '/work/lacam-mapf' },
    width: 'xl',
  },
  {
    slug: 'wordlet',
    title: 'Daily Wordlet',
    blurb: 'One five-letter word a day, the same for everyone. Six guesses.',
    howTo: [
      'Guess the five-letter word in six tries. Any five letters count as a guess, just like the original.',
      'An amber tile is in the right spot; a blue one is in the word somewhere else. Type on your keyboard or tap the keys.',
      'Your board, streak and stats stay in this browser. Want endless rounds instead? The original Flutter build at /wordlet picks a new word every time.',
    ],
    controls: 'Keyboard or touch',
    length: '3 min, once a day',
    opponent: 'Your vocabulary',
    group: 'quick',
    story: { label: 'Wordlet', href: '/work/wordlet' },
    width: 'sm',
  },
  {
    slug: 'bot-or-human',
    title: 'Bot or human?',
    blurb: `${rounds.length} rounds. One line from a public-domain classic, one written by a language model. Spot the bot.`,
    howTo: [
      `Each of the ${rounds.length} rounds pairs a line from a public-domain poem, novel or proverb with an imitation written by a language model.`,
      'Pick the one the bot wrote (click it, or press 1 / 2 or ← / →), then see what gave it away.',
    ],
    controls: 'Mouse, touch or keyboard',
    length: '3 min',
    opponent: 'Language model',
    group: 'quick',
    width: 'xl',
  },
  {
    slug: 'reaction',
    title: 'Reaction test',
    blurb: 'Wait for the panel to light up amber, then hit it as fast as you can.',
    howTo: [
      'Click, tap or press Space to start. Wait for the panel to turn amber, then respond as fast as you can.',
      "Jump early and it doesn't count. The panel tracks your last time, your best and the average of five; your best is kept in this browser.",
    ],
    controls: 'Click, tap or Space',
    length: '30 s',
    opponent: 'The clock',
    group: 'quick',
    width: 'md',
  },
  {
    slug: 'lost-signal',
    title: 'Lost signal',
    blurb: "The 404 page's dodge game. Packets rain down; steer the receiver out of the way.",
    howTo: [
      'Press Space or tap the board to start. Steer with ← / → (or A / D); on a touch screen, drag across the board.',
      'Packets fall faster the longer you last. One hit and the signal is lost.',
    ],
    controls: 'Keyboard or touch',
    length: '1 min',
    opponent: 'Gravity',
    group: 'quick',
    width: 'md',
  },
];

export const gameBySlug = (slug: string) => games.find((g) => g.slug === slug);
