// DOM wiring for the "Draw a digit" game (src/components/games/DrawADigit.astro).
// Loaded on demand when the panel nears the viewport.
import { classify, MAX_LEVEL, parseDataset, PIXELS, SIDE, toMnist, type Dataset, type Prediction } from './knn';

const DATA_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/games/knn-digits/mnist-subset.bin`;
const LINE_WIDTH = 22; // in pad pixels (280 wide); about 2px once scaled to MNIST
const KEY_STEP = 10;

/** Resolves any CSS colour (including light-dark()) to RGB via a 1px canvas. */
function rgbOf(el: Element): [number, number, number] {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = getComputedStyle(el).color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** Paints 0..MAX_LEVEL pixels onto a 28x28 canvas in the element's text colour. */
function paintDigit(canvas: HTMLCanvasElement, px: ArrayLike<number>) {
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = rgbOf(canvas);
  const img = ctx.createImageData(SIDE, SIDE);
  for (let p = 0; p < PIXELS; p++) {
    img.data[p * 4] = r;
    img.data[p * 4 + 1] = g;
    img.data[p * 4 + 2] = b;
    img.data[p * 4 + 3] = Math.round((px[p] / MAX_LEVEL) * 255);
  }
  ctx.putImageData(img, 0, 0);
}

export function mount(root: HTMLElement) {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const pad = $<HTMLCanvasElement>('[data-knn-pad]');
  const cursor = $<HTMLElement>('[data-knn-cursor]');
  const hint = $<HTMLElement>('[data-knn-hint]');
  const clearBtn = $<HTMLButtonElement>('[data-knn-clear]');
  const exampleBtn = $<HTMLButtonElement>('[data-knn-example]');
  const guessEl = $<HTMLOutputElement>('[data-knn-guess]');
  const confidenceEl = $<HTMLElement>('[data-knn-confidence]');
  const seen = $<HTMLCanvasElement>('[data-knn-seen]');
  const voteItems = [...root.querySelectorAll<HTMLElement>('[data-knn-votes] [data-digit]')];
  const kInput = $<HTMLInputElement>('[data-knn-k]');
  const kValue = $<HTMLElement>('[data-knn-k-value]');
  const neighboursEl = $<HTMLOListElement>('[data-knn-neighbours]');
  const emptyEl = $<HTMLElement>('[data-knn-empty]');
  const statusEl = $<HTMLElement>('[data-knn-status]');
  const live = $<HTMLElement>('[data-knn-live]');
  const template = document.getElementById('knn-neighbour-template') as HTMLTemplateElement;

  const ctx = pad.getContext('2d', { willReadFrequently: true })!;
  let data: Dataset | null = null;
  let query: Float32Array | null = null;
  let last: Prediction | null = null;
  let exampleNote = '';
  let exampleIndex = Math.floor(Math.random() * 30);
  let frame = 0;

  // ---- drawing ----
  function setInk() {
    const color = getComputedStyle(pad).color;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function dot(x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, LINE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function line(x0: number, y0: number, x1: number, y1: number) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function clear() {
    ctx.clearRect(0, 0, pad.width, pad.height);
    exampleNote = '';
    query = null;
    last = null;
    hint.hidden = false;
    render();
  }

  function inked() {
    hint.hidden = true;
    exampleNote = '';
    schedule();
  }

  // Classify at most once per animation frame while drawing.
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  }

  function update() {
    const img = ctx.getImageData(0, 0, pad.width, pad.height);
    query = toMnist(img.data, pad.width, pad.height);
    last = query && data ? classify(data.train, query, Number(kInput.value)) : null;
    render();
  }

  // ---- output ----
  function render() {
    if (query) paintDigit(seen, query);
    else seen.getContext('2d')!.clearRect(0, 0, SIDE, SIDE);

    if (!last) {
      guessEl.textContent = '–';
      confidenceEl.textContent = query && !data ? 'Loading training digits…' : 'Waiting for ink';
      voteItems.forEach((li) => setBar(li, 0, false));
      neighboursEl.replaceChildren();
      emptyEl.hidden = false;
      return;
    }

    guessEl.textContent = String(last.label);
    confidenceEl.textContent = `${Math.round(last.confidence * 100)}% of the vote${exampleNote}`;
    voteItems.forEach((li, d) => setBar(li, last!.votes[d], d === last!.label));

    emptyEl.hidden = true;
    const thumbs: [HTMLCanvasElement, Uint8Array][] = [];
    neighboursEl.replaceChildren(
      ...last.neighbours.map(({ digit, distance }, i) => {
        const li = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
        const thumb = li.querySelector('canvas')!;
        const label = li.querySelector<HTMLElement>('[data-label]')!;
        const agrees = digit.label === last!.label;
        thumb.classList.toggle('text-primary', agrees);
        thumb.classList.toggle('text-on-surface', !agrees);
        thumb.setAttribute('role', 'img');
        thumb.setAttribute('aria-label', `Neighbour ${i + 1}: a ${digit.label}, distance ${distance.toFixed(1)}`);
        label.textContent = `${digit.label} · ${distance.toFixed(0)}`;
        label.classList.toggle('text-primary', agrees);
        thumbs.push([thumb, digit.px]);
        return li;
      }),
    );
    // Paint once attached, so the thumbnails pick up their theme colour.
    for (const [thumb, px] of thumbs) paintDigit(thumb, px);
  }

  function setBar(li: HTMLElement, share: number, winner: boolean) {
    const bar = li.querySelector<HTMLElement>('[data-bar]')!;
    bar.style.height = `${Math.round(share * 100)}%`;
    bar.classList.toggle('bg-primary', winner);
    bar.classList.toggle('bg-outline-variant', !winner);
    li.querySelector('[data-digit-label]')!.classList.toggle('text-primary', winner);
    li.setAttribute('aria-label', `${li.dataset.digit}: ${Math.round(share * 100)}%`);
  }

  function announce() {
    live.textContent = last
      ? `Looks like a ${last.label}, ${Math.round(last.confidence * 100)}% of the vote from ${last.neighbours.length} neighbours.${exampleNote}`
      : '';
  }

  // ---- pointer input (mouse, touch, pen) ----
  let drawing = false;
  let px = 0;
  let py = 0;

  function toPad(e: PointerEvent): [number, number] {
    const r = pad.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * pad.width, ((e.clientY - r.top) / r.height) * pad.height];
  }

  pad.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pad.setPointerCapture(e.pointerId);
    pad.focus({ preventScroll: true });
    drawing = true;
    setInk();
    [px, py] = toPad(e);
    dot(px, py);
    inked();
  });

  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of events.length ? events : [e]) {
      const [x, y] = toPad(ev);
      line(px, py, x, y);
      [px, py] = [x, y];
    }
    inked();
  });

  const end = () => {
    if (!drawing) return;
    drawing = false;
    update();
    announce();
  };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);

  // ---- keyboard input ----
  let kx = pad.width / 2;
  let ky = pad.height / 2;
  let penDown = false;

  function placeCursor() {
    cursor.style.left = `${(kx / pad.width) * 100}%`;
    cursor.style.top = `${(ky / pad.height) * 100}%`;
    cursor.classList.toggle('bg-primary', penDown);
  }
  placeCursor();

  pad.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? KEY_STEP * 3 : KEY_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (e.key in moves) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      const nx = Math.min(pad.width, Math.max(0, kx + dx));
      const ny = Math.min(pad.height, Math.max(0, ky + dy));
      if (penDown) {
        setInk();
        line(kx, ky, nx, ny);
        inked();
      }
      [kx, ky] = [nx, ny];
      placeCursor();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      penDown = !penDown;
      if (penDown) {
        setInk();
        dot(kx, ky);
        inked();
        live.textContent = 'Pen down';
      } else {
        update();
        announce();
      }
      placeCursor();
    } else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Escape') {
      e.preventDefault();
      penDown = false;
      placeCursor();
      clear();
      live.textContent = 'Cleared';
    }
  });

  // ---- controls ----
  clearBtn.addEventListener('click', () => {
    clear();
    live.textContent = 'Cleared';
  });

  kInput.addEventListener('input', () => {
    kValue.textContent = kInput.value;
    // Reuse the current query so a test digit keeps its original pixels.
    if (query && data) {
      last = classify(data.train, query, Number(kInput.value));
      render();
    }
  });
  kInput.addEventListener('change', announce);

  exampleBtn.addEventListener('click', () => {
    if (!data) return;
    const ex = data.examples[exampleIndex++ % data.examples.length];
    // Show the 28x28 test digit full-size on the pad, but classify its
    // original pixels: it is already in MNIST format, and re-cropping the
    // upscaled copy would only blur it.
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = SIDE;
    tmp.classList.add('text-primary');
    pad.after(tmp);
    paintDigit(tmp, ex.px);
    tmp.remove();
    ctx.clearRect(0, 0, pad.width, pad.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmp, 0, 0, pad.width, pad.height);
    hint.hidden = true;
    query = Float32Array.from(ex.px);
    last = classify(data.train, query, Number(kInput.value));
    exampleNote = ` · MNIST test digit labelled ${ex.label}`;
    render();
    announce();
  });

  // ---- theme changes: recolour the existing ink and thumbnails ----
  function recolour() {
    ctx.save();
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = getComputedStyle(pad).color;
    ctx.fillRect(0, 0, pad.width, pad.height);
    ctx.restore();
    render();
  }
  new MutationObserver(recolour).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolour);

  // ---- data ----
  fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      data = parseDataset(buf);
      statusEl.textContent = `${data.train.length} MNIST training digits loaded, ${data.train.length / 10} per class.`;
      exampleBtn.disabled = false;
      if (query) update();
    })
    .catch((err) => {
      console.error('Draw a digit: could not load training digits', err);
      statusEl.textContent = 'The training digits failed to load, so the classifier is offline. Try reloading the page.';
      statusEl.classList.add('text-error');
    });

  render();
}
