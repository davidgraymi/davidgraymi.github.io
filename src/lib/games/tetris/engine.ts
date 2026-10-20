/**
 * Tetris rules, ported from the original Python environment the agent was
 * trained in (tetris-ai/src/tetris.py): a 10x20 well, the same seven shapes
 * and rotation tables, pieces spawning at the top, and the same score per
 * placed piece — 1 + 10 x (lines cleared)^2.
 *
 * Two additions for a human opponent: a seeded 7-bag so both boards see the
 * identical piece sequence, and simple wall kicks so rotating next to a wall
 * feels fair. Nothing here touches the DOM.
 */

export const WIDTH = 10;
export const HEIGHT = 20;

type Matrix = number[][];

// Order and orientations match Tetris.SHAPES in the Python source.
const S: Matrix[] = [
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 0],
    [1, 1],
    [0, 1],
  ],
];
const Z: Matrix[] = [
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1],
    [1, 1],
    [1, 0],
  ],
];
const I: Matrix[] = [[[1, 1, 1, 1]], [[1], [1], [1], [1]]];
const O: Matrix[] = [
  [
    [1, 1],
    [1, 1],
  ],
];
const J: Matrix[] = [
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [1, 1],
    [1, 0],
    [1, 0],
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
  ],
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
];
const L: Matrix[] = [
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [1, 0, 0],
  ],
  [
    [1, 1],
    [0, 1],
    [0, 1],
  ],
];
const T: Matrix[] = [
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 0],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [0, 1],
  ],
];

export const PIECE_NAMES = ['S', 'Z', 'I', 'O', 'J', 'L', 'T'] as const;

export interface Cell {
  x: number;
  y: number;
}

export interface Rotation {
  w: number;
  h: number;
  cells: Cell[];
}

/** SHAPES[type][rotation] — cells as offsets from the piece's top-left corner. */
export const SHAPES: Rotation[][] = [S, Z, I, O, J, L, T].map((rotations) =>
  rotations.map((m) => {
    const cells: Cell[] = [];
    m.forEach((row, y) => row.forEach((v, x) => v && cells.push({ x, y })));
    return { w: m[0].length, h: m.length, cells };
  }),
);

/** Board cells hold 0 for empty or piece type + 1. Row-major, row 0 at the top. */
export type Board = Uint8Array;

export const emptyBoard = (): Board => new Uint8Array(WIDTH * HEIGHT);

export interface Piece {
  type: number;
  rot: number;
  x: number;
  y: number;
}

export function collides(board: Board, type: number, rot: number, px: number, py: number): boolean {
  for (const c of SHAPES[type][rot].cells) {
    const x = px + c.x;
    const y = py + c.y;
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return true;
    if (board[y * WIDTH + x]) return true;
  }
  return false;
}

/** Lowest y the piece can fall to from (x, y). Assumes (x, y) itself is free. */
export function dropY(board: Board, type: number, rot: number, x: number, y: number): number {
  while (!collides(board, type, rot, x, y + 1)) y++;
  return y;
}

/** Writes the piece into `board` in place. */
export function merge(board: Board, type: number, rot: number, px: number, py: number): void {
  for (const c of SHAPES[type][rot].cells) board[(py + c.y) * WIDTH + px + c.x] = type + 1;
}

/** Removes full rows in place, shifting everything above down. Returns the cleared row indices. */
export function clearLines(board: Board): number[] {
  const cleared: number[] = [];
  let write = HEIGHT - 1;
  for (let read = HEIGHT - 1; read >= 0; read--) {
    let full = true;
    for (let x = 0; x < WIDTH; x++) {
      if (!board[read * WIDTH + x]) {
        full = false;
        break;
      }
    }
    if (full) {
      cleared.push(read);
      continue;
    }
    if (write !== read) board.copyWithin(write * WIDTH, read * WIDTH, read * WIDTH + WIDTH);
    write--;
  }
  board.fill(0, 0, (write + 1) * WIDTH);
  return cleared;
}

/** Reward per placed piece in the training environment. */
export const placementScore = (lines: number) => 1 + lines * lines * WIDTH;

/** Small, fast, seedable PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded 7-bag. Two bags built from the same seed deal the same pieces. */
export class PieceQueue {
  private rand: () => number;
  private queue: number[] = [];

  constructor(seed: number) {
    this.rand = rng(seed);
  }

  private refill() {
    const bag = [0, 1, 2, 3, 4, 5, 6];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }

  peek(n: number): number[] {
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  next(): number {
    if (!this.queue.length) this.refill();
    return this.queue.shift()!;
  }
}

const KICKS = [0, -1, 1, -2, 2];

export class Tetris {
  board: Board = emptyBoard();
  piece!: Piece;
  queue: PieceQueue;
  score = 0;
  lines = 0;
  pieces = 0;
  over = false;

  constructor(seed: number) {
    this.queue = new PieceQueue(seed);
    this.spawn();
  }

  private spawn() {
    const type = this.queue.next();
    const { w } = SHAPES[type][0];
    this.piece = { type, rot: 0, x: Math.floor((WIDTH - w) / 2), y: 0 };
    if (collides(this.board, type, 0, this.piece.x, 0)) this.over = true;
  }

  fits(rot: number, x: number, y: number): boolean {
    return !collides(this.board, this.piece.type, rot, x, y);
  }

  move(dx: number, dy: number): boolean {
    const p = this.piece;
    if (this.over || !this.fits(p.rot, p.x + dx, p.y + dy)) return false;
    p.x += dx;
    p.y += dy;
    return true;
  }

  rotate(dir: 1 | -1): boolean {
    const p = this.piece;
    if (this.over) return false;
    const n = SHAPES[p.type].length;
    const rot = (p.rot + dir + n) % n;
    if (rot === p.rot) return false;
    for (const k of KICKS) {
      if (this.fits(rot, p.x + k, p.y)) {
        p.rot = rot;
        p.x += k;
        return true;
      }
    }
    return false;
  }

  ghostY(): number {
    const p = this.piece;
    return dropY(this.board, p.type, p.rot, p.x, p.y);
  }

  /** Locks the active piece where it is, clears lines, deals the next piece. */
  lock(): number[] {
    const p = this.piece;
    merge(this.board, p.type, p.rot, p.x, p.y);
    const cleared = clearLines(this.board);
    this.score += placementScore(cleared.length);
    this.lines += cleared.length;
    this.pieces++;
    this.spawn();
    return cleared;
  }

  hardDrop(): number[] {
    this.piece.y = this.ghostY();
    return this.lock();
  }

  /** Places the active piece at an exact (rot, x, y), as the agent does. */
  place(rot: number, x: number, y: number): number[] {
    Object.assign(this.piece, { rot, x, y });
    return this.lock();
  }
}
