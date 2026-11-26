// A plain-TypeScript port of the outer-loop thinking model from CS440-Final-Project
// (src/cs440_final_project/models.py TRM with mixer="mlp", head="game_cols", and
// c4_ponder.episode). No ML runtime: Float32Array matmuls, about 136M multiply-adds
// per outer step. Checked against PyTorch outputs in scripts/check-connect-four.mjs.
//
// One outer step (T=1, n=1):   z <- net(z + x + y);   y <- net(y + z)
// net = 2 blocks, each: SwiGLU across the 43 positions (post-norm over positions),
// then SwiGLU across the 256 channels (post-norm over channels).
// Heads read y after every step: a move per column, an outcome class per column,
// a win/draw/loss value, and the stop logit.
import manifest from './manifest.json';

export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 1;
export const OWN = 2;
export const OPP = 3;
export const K_MAX: number = manifest.cfg.n_sup;

const D = manifest.cfg.d_model; // 256
const L = manifest.cfg.seq_len + manifest.cfg.n_prefix; // 43
const P = manifest.cfg.n_prefix; // 1
const EPS = 1e-5;
const SCALE = Math.sqrt(D);
export const N_CLASSES = 9;

type Weights = Record<string, Float32Array>;

interface Block {
  tGateUp: Float32Array; // (2*Ht, L)
  tDown: Float32Array; // (L, Ht)
  ht: number;
  cGateUp: Float32Array; // (2*Hc, D)
  cDown: Float32Array; // (D, Hc)
  hc: number;
}

/** Converts IEEE half floats to float32. */
function halfToFloat(src: Uint16Array): Float32Array {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const h = src[i];
    const s = h & 0x8000 ? -1 : 1;
    const e = (h >> 10) & 0x1f;
    const f = h & 0x3ff;
    out[i] = e === 0 ? s * f * 2 ** -24 : e === 31 ? (f ? NaN : s * Infinity) : s * (1 + f / 1024) * 2 ** (e - 15);
  }
  return out;
}

export function parseWeights(buf: ArrayBuffer): Weights {
  const all = halfToFloat(new Uint16Array(buf));
  const w: Weights = {};
  for (const t of manifest.tensors) w[t.name] = all.subarray(t.offset, t.offset + t.length);
  return w;
}

/** out[r, o] = sum_i a[r, i] * W[o, i]   (a: rows x n, W: m x n, row-major) */
function matmulT(a: Float32Array, rows: number, n: number, W: Float32Array, m: number, out: Float32Array) {
  for (let r = 0; r < rows; r++) {
    const ao = r * n;
    const oo = r * m;
    for (let o = 0; o < m; o++) {
      const wo = o * n;
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
      let i = 0;
      for (; i + 3 < n; i += 4) {
        s0 += a[ao + i] * W[wo + i];
        s1 += a[ao + i + 1] * W[wo + i + 1];
        s2 += a[ao + i + 2] * W[wo + i + 2];
        s3 += a[ao + i + 3] * W[wo + i + 3];
      }
      for (; i < n; i++) s0 += a[ao + i] * W[wo + i];
      out[oo + o] = s0 + s1 + s2 + s3;
    }
  }
}

const silu = (x: number) => x / (1 + Math.exp(-x));

/** Parameter-free RMSNorm over each row of a (rows x n) matrix, in place. */
function rmsRows(a: Float32Array, rows: number, n: number) {
  for (let r = 0; r < rows; r++) {
    let ss = 0;
    for (let i = 0; i < n; i++) ss += a[r * n + i] ** 2;
    const k = 1 / Math.sqrt(ss / n + EPS);
    for (let i = 0; i < n; i++) a[r * n + i] *= k;
  }
}

export interface StepOutput {
  step: number; // 1-based
  policy: number[]; // softmax over legal columns
  logits: number[];
  cols: number[][]; // per column: 9-class softmax (worst..best), [] for full columns
  value: number[]; // loss / draw / win for the side to move
  lambda: number; // chance of stopping here, given it got this far
  stopped: number; // cumulative chance it has stopped by now
  change: number[]; // per board cell (42, top row first): how much the answer state moved this step
}

export class ThinkingModel {
  private blocks: Block[] = [];
  private scratch: Record<string, Float32Array>;

  constructor(private w: Weights) {
    for (let b = 0; b < manifest.cfg.n_layers; b++) {
      const p = `net.layers.${b}.`;
      const tGateUp = w[p + 'mlp_t.gate_up.weight'];
      const cGateUp = w[p + 'mlp.gate_up.weight'];
      this.blocks.push({
        tGateUp,
        tDown: w[p + 'mlp_t.down.weight'],
        ht: tGateUp.length / L / 2,
        cGateUp,
        cDown: w[p + 'mlp.down.weight'],
        hc: cGateUp.length / D / 2,
      });
    }
    const ht = this.blocks[0].ht, hc = this.blocks[0].hc;
    this.scratch = {
      t: new Float32Array(D * L),
      tgu: new Float32Array(D * 2 * ht),
      th: new Float32Array(D * ht),
      tout: new Float32Array(D * L),
      cgu: new Float32Array(L * 2 * hc),
      ch: new Float32Array(L * hc),
      cout: new Float32Array(L * D),
    };
  }

  /** One block, in place on h (L x D). */
  private block(h: Float32Array, b: Block) {
    const s = this.scratch;
    // token mixer, in the transposed (D x L) layout
    for (let l = 0; l < L; l++) for (let d = 0; d < D; d++) s.t[d * L + l] = h[l * D + d];
    matmulT(s.t, D, L, b.tGateUp, 2 * b.ht, s.tgu);
    for (let d = 0; d < D; d++)
      for (let j = 0; j < b.ht; j++) {
        const g = s.tgu[d * 2 * b.ht + j];
        s.th[d * b.ht + j] = silu(g) * s.tgu[d * 2 * b.ht + b.ht + j];
      }
    matmulT(s.th, D, b.ht, b.tDown, L, s.tout);
    for (let i = 0; i < D * L; i++) s.t[i] += s.tout[i];
    rmsRows(s.t, D, L);
    for (let l = 0; l < L; l++) for (let d = 0; d < D; d++) h[l * D + d] = s.t[d * L + l];
    // channel mixer
    matmulT(h, L, D, b.cGateUp, 2 * b.hc, s.cgu);
    for (let l = 0; l < L; l++)
      for (let j = 0; j < b.hc; j++) {
        const g = s.cgu[l * 2 * b.hc + j];
        s.ch[l * b.hc + j] = silu(g) * s.cgu[l * 2 * b.hc + b.hc + j];
      }
    matmulT(s.ch, L, b.hc, b.cDown, D, s.cout);
    for (let i = 0; i < L * D; i++) h[i] += s.cout[i];
    rmsRows(h, L, D);
  }

  /** net(state + inject), written to out. */
  private net(state: Float32Array, inject: Float32Array, out: Float32Array) {
    for (let i = 0; i < out.length; i++) out[i] = state[i] + inject[i];
    for (const b of this.blocks) this.block(out, b);
  }

  /**
   * Runs outer steps on 42 tokens (top row first, from the side to move's view:
   * 1 empty, 2 own, 3 opponent). Calls onStep after each one. Stops at the step
   * where the cumulative stop chance first reaches 1/2 (the model's answer), or
   * at maxSteps. Returns every step's output.
   */
  *think(tokens: ArrayLike<number>, maxSteps = K_MAX): Generator<StepOutput> {
    const w = this.w;
    const x = new Float32Array(L * D);
    for (let d = 0; d < D; d++) x[d] = w['prefix'][d] * SCALE;
    for (let c = 0; c < 42; c++) {
      const tok = tokens[c];
      for (let d = 0; d < D; d++) x[(c + P) * D + d] = w['embed.weight'][tok * D + d] * SCALE;
    }
    let y = new Float32Array(L * D);
    let z = new Float32Array(L * D);
    for (let l = 0; l < L; l++) {
      y.set(w['y_init'], l * D);
      z.set(w['z_init'], l * D);
    }
    const xy = new Float32Array(L * D);
    let nz = new Float32Array(L * D);
    let ny = new Float32Array(L * D);
    const legal = Array.from({ length: COLS }, (_, c) => tokens[c] === EMPTY);
    let survive = 1;

    for (let k = 1; k <= maxSteps; k++) {
      for (let i = 0; i < xy.length; i++) xy[i] = x[i] + y[i];
      this.net(z, xy, nz);
      this.net(y, nz, ny);
      const change = new Array<number>(42);
      for (let c = 0; c < 42; c++) {
        let ss = 0;
        for (let d = 0; d < D; d++) ss += (ny[(c + P) * D + d] - y[(c + P) * D + d]) ** 2;
        change[c] = Math.sqrt(ss / D);
      }
      [y, ny] = [ny, y];
      [z, nz] = [nz, z];

      // heads
      const colMean = new Float32Array(COLS * D);
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          for (let d = 0; d < D; d++) colMean[c * D + d] += y[(P + r * COLS + c) * D + d] / ROWS;
      const logits: number[] = [];
      const cols: number[][] = [];
      for (let c = 0; c < COLS; c++) {
        let s = w['policy_head.bias'][0];
        for (let d = 0; d < D; d++) s += colMean[c * D + d] * w['policy_head.weight'][d];
        logits.push(legal[c] ? s : -1e9);
        const cl: number[] = [];
        for (let j = 0; j < N_CLASSES; j++) {
          let v = w['col_head.bias'][j];
          for (let d = 0; d < D; d++) v += colMean[c * D + d] * w['col_head.weight'][j * D + d];
          cl.push(v);
        }
        cols.push(legal[c] ? softmax(cl) : []);
      }
      const value: number[] = [];
      for (let j = 0; j < 3; j++) {
        let v = w['value_head.bias'][j];
        for (let d = 0; d < D; d++) v += y[d] * w['value_head.weight'][j * D + d];
        value.push(v);
      }
      let q = w['q_head.bias'][0];
      for (let d = 0; d < D; d++) q += y[d] * w['q_head.weight'][d];
      const lambda = k === maxSteps ? 1 : 1 / (1 + Math.exp(-q));
      survive *= 1 - lambda;
      const stopped = 1 - survive;
      yield { step: k, policy: softmax(logits), logits, cols, value: softmax(value), lambda, stopped, change };
      if (stopped >= 0.5) return;
    }
  }
}

function softmax(v: number[]): number[] {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

/** The model's move: argmax of the policy at the step it stopped on. */
export const chosenColumn = (s: StepOutput) => s.policy.indexOf(Math.max(...s.policy));
