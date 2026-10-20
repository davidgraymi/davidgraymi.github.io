/**
 * The agent: the trained value network from the original project, running in
 * plain TypeScript.
 *
 * The DQN never picks joystick moves. For every legal (rotation, column)
 * placement of the current piece it scores the board that would result, and
 * takes the best. A board is summarised by four numbers — lines cleared,
 * holes, bumpiness and aggregate height — fed through a 4 -> 32 -> 32 -> 1
 * ReLU network. `weights.json` is exported verbatim from the Keras checkpoint
 * the project's own test script loads (tetris-nn_4-8.h5).
 */
import weights from './weights.json';
import { HEIGHT, SHAPES, WIDTH, clearLines, collides, dropY, merge, type Board } from './engine';

interface Layer {
  w: number[][];
  b: number[];
}

const layers = weights.layers as Layer[];

/** Forward pass. Hidden layers use ReLU, the output is linear. */
export function value(input: number[]): number {
  let x = input;
  layers.forEach((layer, i) => {
    const last = i === layers.length - 1;
    x = layer.w.map((row, j) => {
      let s = layer.b[j];
      for (let k = 0; k < row.length; k++) s += row[k] * x[k];
      return last || s > 0 ? s : 0;
    });
  });
  return x[0];
}

/**
 * The four state features, computed exactly as Tetris.get_game_state does:
 * clear lines first, then measure the board that is left.
 */
export function features(board: Board): [number, number, number, number] {
  const lines = clearLines(board).length;
  let holes = 0;
  let bumpiness = 0;
  let height = 0;
  let prevTop = -1;
  for (let x = 0; x < WIDTH; x++) {
    let top = 0;
    while (top < HEIGHT && !board[top * WIDTH + x]) top++;
    for (let y = top + 1; y < HEIGHT; y++) if (!board[y * WIDTH + x]) holes++;
    height += HEIGHT - top;
    if (prevTop >= 0) bumpiness += Math.abs(top - prevTop);
    prevTop = top;
  }
  return [lines, holes, bumpiness, height];
}

export interface Plan {
  rot: number;
  x: number;
  y: number;
  value: number;
  features: [number, number, number, number];
}

/** Scores every legal placement of `type` and returns the best one, or null if none fit. */
export function bestPlacement(board: Board, type: number): Plan | null {
  let best: Plan | null = null;
  const scratch = new Uint8Array(board.length);
  SHAPES[type].forEach((shape, rot) => {
    for (let x = 0; x <= WIDTH - shape.w; x++) {
      if (collides(board, type, rot, x, 0)) continue;
      const y = dropY(board, type, rot, x, 0);
      scratch.set(board);
      merge(scratch, type, rot, x, y);
      const f = features(scratch);
      const v = value(f);
      if (!best || v > best.value) best = { rot, x, y, value: v, features: f };
    }
  });
  return best;
}
