// Pure KNN + preprocessing for the "Draw a digit" game. No DOM access here.
// The binary format is documented in scripts/knn-digits/build-dataset.mjs.

export const SIDE = 28;
export const PIXELS = SIDE * SIDE;
/** Pixel values run 0 (background) to 15 (full ink). */
export const MAX_LEVEL = 15;

export interface Digit {
  label: number;
  /** PIXELS values, 0..MAX_LEVEL, row-major. */
  px: Uint8Array;
}

export interface Dataset {
  train: Digit[];
  /** Held-out MNIST test digits, never used as neighbours. */
  examples: Digit[];
}

export function parseDataset(buf: ArrayBuffer): Dataset {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  if (magic !== 'KNN1') throw new Error('Unrecognised digit dataset');
  const trainCount = view.getUint16(4, true);
  const exampleCount = view.getUint16(6, true);
  if (bytes[8] !== SIDE || bytes[9] !== SIDE) throw new Error('Unexpected digit size');
  const total = trainCount + exampleCount;
  const labelsAt = 10;
  const pixelsAt = labelsAt + total;
  if (bytes.length !== pixelsAt + (total * PIXELS) / 2) throw new Error('Truncated digit dataset');

  const digits: Digit[] = [];
  for (let n = 0; n < total; n++) {
    const px = new Uint8Array(PIXELS);
    const base = pixelsAt + (n * PIXELS) / 2;
    for (let p = 0; p < PIXELS; p += 2) {
      const b = bytes[base + p / 2];
      px[p] = b >> 4;
      px[p + 1] = b & 0x0f;
    }
    digits.push({ label: bytes[labelsAt + n], px });
  }
  return { train: digits.slice(0, trainCount), examples: digits.slice(trainCount) };
}

/**
 * Turns a drawing's alpha channel into an MNIST-style 28x28 digit: crop to the
 * ink, scale the longer side to 20px (area averaging), then place it so its
 * centre of mass sits at the centre of the 28x28 frame, as MNIST does.
 * Returns null when there's no ink.
 */
export function toMnist(alpha: Uint8ClampedArray, width: number, height: number, stride = 4, offset = 3): Float32Array | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * stride + offset] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const box = 20;
  const scale = box / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * scale));
  const th = Math.max(1, Math.round(bh * scale));

  // Area-average the bounding box down to tw x th.
  const small = new Float32Array(tw * th);
  for (let ty = 0; ty < th; ty++) {
    const y0 = minY + Math.floor(ty / scale);
    const y1 = Math.max(y0 + 1, Math.min(maxY + 1, minY + Math.ceil((ty + 1) / scale)));
    for (let tx = 0; tx < tw; tx++) {
      const x0 = minX + Math.floor(tx / scale);
      const x1 = Math.max(x0 + 1, Math.min(maxX + 1, minX + Math.ceil((tx + 1) / scale)));
      let sum = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) sum += alpha[(y * width + x) * stride + offset];
      }
      small[ty * tw + tx] = sum / ((y1 - y0) * (x1 - x0));
    }
  }

  // Centre of mass of the scaled digit.
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const v = small[y * tw + x];
      mass += v;
      cx += v * (x + 0.5);
      cy += v * (y + 0.5);
    }
  }
  if (mass === 0) return null;
  const ox = Math.round(SIDE / 2 - cx / mass);
  const oy = Math.round(SIDE / 2 - cy / mass);

  const out = new Float32Array(PIXELS);
  let peak = 0;
  for (let y = 0; y < th; y++) {
    const yy = y + oy;
    if (yy < 0 || yy >= SIDE) continue;
    for (let x = 0; x < tw; x++) {
      const xx = x + ox;
      if (xx < 0 || xx >= SIDE) continue;
      const v = small[y * tw + x];
      out[yy * SIDE + xx] = v;
      if (v > peak) peak = v;
    }
  }
  // Stretch so the darkest stroke is full ink, like MNIST, then map to 0..15.
  const k = peak > 0 ? MAX_LEVEL / peak : 0;
  for (let p = 0; p < PIXELS; p++) out[p] = Math.min(MAX_LEVEL, out[p] * k);
  return out;
}

export interface Neighbour {
  digit: Digit;
  distance: number;
}

export interface Prediction {
  label: number;
  /** Winner's share of the weighted vote, 0..1. */
  confidence: number;
  /** Weighted vote per digit, summing to 1. */
  votes: number[];
  neighbours: Neighbour[];
}

/**
 * Weighted KNN: Euclidean distance over pixels; each of the k nearest
 * training digits votes 1 / (1 + distance) for its label.
 */
export function classify(train: Digit[], query: ArrayLike<number>, k: number): Prediction {
  const best: { i: number; d: number }[] = [];
  for (let i = 0; i < train.length; i++) {
    const px = train[i].px;
    let d = 0;
    for (let p = 0; p < PIXELS; p++) {
      const diff = px[p] - query[p];
      d += diff * diff;
    }
    if (best.length < k || d < best[best.length - 1].d) {
      let at = best.length;
      while (at > 0 && best[at - 1].d > d) at--;
      best.splice(at, 0, { i, d });
      if (best.length > k) best.pop();
    }
  }

  const votes = new Array<number>(10).fill(0);
  const neighbours = best.map(({ i, d }) => {
    const distance = Math.sqrt(d);
    votes[train[i].label] += 1 / (1 + distance);
    return { digit: train[i], distance };
  });
  const total = votes.reduce((a, b) => a + b, 0) || 1;
  for (let v = 0; v < 10; v++) votes[v] /= total;
  const label = votes.indexOf(Math.max(...votes));
  return { label, confidence: votes[label], votes, neighbours };
}
