// Four-in-a-row rules on a 7x6 board. grid[r][c], r = 0 is the bottom row;
// 0 empty, 1 first player, 2 second player.
import { COLS, EMPTY, OPP, OWN, ROWS } from './model';

export type Cell = 0 | 1 | 2;

export class Board {
  grid: Cell[][] = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
  heights = Array<number>(COLS).fill(0);
  moves: number[] = [];

  get toMove(): 1 | 2 {
    return (1 + (this.moves.length % 2)) as 1 | 2;
  }

  canPlay(c: number) {
    return this.heights[c] < ROWS;
  }

  play(c: number): number {
    const r = this.heights[c]++;
    this.grid[r][c] = this.toMove;
    this.moves.push(c);
    return r;
  }

  full() {
    return this.moves.length === ROWS * COLS;
  }

  /** The four (or more) cells of a line through (r, c), if the piece there completes one. */
  winLine(r: number, c: number): [number, number][] | null {
    const p = this.grid[r][c];
    if (!p) return null;
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const line: [number, number][] = [[r, c]];
      for (const s of [1, -1]) {
        let rr = r + s * dr, cc = c + s * dc;
        while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && this.grid[rr][cc] === p) {
          line.push([rr, cc]);
          rr += s * dr;
          cc += s * dc;
        }
      }
      if (line.length >= 4) return line;
    }
    return null;
  }

  /** 42 model tokens, top row first, from the side to move's point of view. */
  tokens(): number[] {
    const me = this.toMove;
    const out: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--)
      for (let c = 0; c < COLS; c++) {
        const v = this.grid[r][c];
        out.push(v === 0 ? EMPTY : v === me ? OWN : OPP);
      }
    return out;
  }
}
