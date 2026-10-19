/**
 * Interactive header dot field (easter egg).
 *
 * Takes over the `.dot-field` texture with a canvas that draws the same dots
 * (12px pitch, ink colour, fading up into the surface) and lets them be pushed
 * around by the pointer. Typing "life" or triple-clicking an empty part of the
 * header turns the grid into Conway's Game of Life; Escape puts it back.
 *
 * Without JS (or before this loads) the CSS background is untouched, so the
 * static header renders exactly as before. The canvas only takes over once it
 * has drawn its first frame, and it only runs requestAnimationFrame while
 * something is actually moving and the header is on screen.
 */

const PITCH = 12; // matches .dot-field background-size
const OFFSET = PITCH / 2; // radial-gradient dots sit in the tile centre
const DOT_R = 1.25;
const CELL_R = 2.25;
const FADE_END = 0.75; // the surface gradient reaches transparent at 75%

const REPEL_R = 80;
const REPEL_FORCE = 0.9;
const BURST_R = 140;
const BURST_FORCE = 9;
const SPRING = 0.06;
const DAMPING = 0.82;
const REST = 0.02;

const LIFE_STEP_MS = 120;
const LIFE_DENSITY = 0.28;
const SECRET = 'life';

const IGNORE = 'a, button, input, textarea, select, label, summary, [tabindex], h1, h2, h3, p, li, img, svg, figure';

type Rgba = [number, number, number, number];

/** True if the hint was already shown this session; marks it shown otherwise. */
function hinted(): boolean {
  try {
    if (sessionStorage.getItem('dot-field-hint')) return true;
    sessionStorage.setItem('dot-field-hint', '1');
  } catch {
    // Storage blocked: just show the hint.
  }
  return false;
}

function isEditable(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

export function mountDotField(el: HTMLElement): () => void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  let reduced = reduceQuery.matches;

  // ---------------------------------------------------------------- layout
  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let ox = new Float32Array(0);
  let oy = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let cells = new Uint8Array(0);
  let scratch = new Uint8Array(0);

  // ---------------------------------------------------------------- colour
  let dotColor: Rgba = [0, 0, 0, 0.2];
  let cellColor: Rgba = [217, 119, 6, 1];
  const probe = document.createElement('span');
  probe.style.display = 'none';
  const pixel = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  // Tokens use light-dark() and color-mix(), which canvas can't parse directly:
  // let the cascade resolve them, then read the result back as plain RGBA.
  function resolve(token: string, fallback: Rgba): Rgba {
    if (!pixel) return fallback;
    probe.style.color = `var(${token})`;
    const computed = getComputedStyle(probe).color;
    pixel.clearRect(0, 0, 1, 1);
    pixel.fillStyle = `rgba(${fallback[0]}, ${fallback[1]}, ${fallback[2]}, ${fallback[3]})`;
    pixel.fillStyle = computed;
    pixel.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  }
  const css = ([r, g, b, a]: Rgba) => `rgba(${r}, ${g}, ${b}, ${a})`;
  function readColors() {
    dotColor = resolve('--md-sys-color-dot-field', dotColor);
    cellColor = resolve('--md-sys-color-primary', cellColor);
  }

  // ---------------------------------------------------------------- state
  let visible = true;
  let raf = 0;
  let lastStep = 0;
  let pointerIn = false;
  let px = 0;
  let py = 0;
  let clientX = 0;
  let clientY = 0;
  let life = false;
  let generation = 0;
  let bursts = 0;
  let typed = '';

  // A small visual readout (aria-hidden: it ticks every generation) plus a
  // polite live region that only announces mode changes.
  const status = document.createElement('p');
  status.setAttribute('aria-hidden', 'true');
  status.className =
    'pointer-events-none absolute bottom-3 right-4 font-mono text-label tracking-widest uppercase text-on-surface-variant opacity-0 transition-opacity duration-300';
  const live = document.createElement('p');
  live.setAttribute('role', 'status');
  live.className = 'sr-only';
  let hintTimer = 0;

  function say(text: string, show = true) {
    status.textContent = text;
    status.style.opacity = show && text ? '0.8' : '0';
  }

  function resize() {
    const rect = el.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const nc = Math.ceil(w / PITCH);
    const nr = Math.ceil(h / PITCH);
    if (nc !== cols || nr !== rows) {
      cols = nc;
      rows = nr;
      const n = cols * rows;
      ox = new Float32Array(n);
      oy = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      cells = new Uint8Array(n);
      scratch = new Uint8Array(n);
      if (life) seed();
    }
    draw();
  }

  // ---------------------------------------------------------------- drawing
  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const fadeH = h * FADE_END;
    ctx.fillStyle = css(dotColor);
    for (let j = 0; j < rows; j++) {
      const y = OFFSET + j * PITCH;
      const fade = Math.min(1, y / fadeH);
      if (fade <= 0) continue;
      ctx.globalAlpha = fade;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        if (life && cells[k]) continue;
        const x = OFFSET + i * PITCH + ox[k];
        const yy = y + oy[k];
        ctx.moveTo(x + DOT_R, yy);
        ctx.arc(x, yy, DOT_R, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    if (life) {
      ctx.fillStyle = css(cellColor);
      for (let j = 0; j < rows; j++) {
        const y = OFFSET + j * PITCH;
        ctx.globalAlpha = 0.35 + 0.55 * Math.min(1, y / fadeH);
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          if (!cells[j * cols + i]) continue;
          const x = OFFSET + i * PITCH;
          ctx.moveTo(x + CELL_R, y);
          ctx.arc(x, y, CELL_R, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- physics
  /** Advances the springs one frame; returns true while anything still moves. */
  function physics(): boolean {
    let moving = false;
    const r2 = REPEL_R * REPEL_R;
    for (let j = 0, k = 0; j < rows; j++) {
      const by = OFFSET + j * PITCH;
      for (let i = 0; i < cols; i++, k++) {
        if (pointerIn && !reduced) {
          const dx = OFFSET + i * PITCH + ox[k] - px;
          const dy = by + oy[k] - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / REPEL_R) ** 2 * REPEL_FORCE;
            vx[k] += (dx / d) * f;
            vy[k] += (dy / d) * f;
          }
        }
        vx[k] = (vx[k] - ox[k] * SPRING) * DAMPING;
        vy[k] = (vy[k] - oy[k] * SPRING) * DAMPING;
        ox[k] += vx[k];
        oy[k] += vy[k];
        if (Math.abs(vx[k]) > REST || Math.abs(vy[k]) > REST) moving = true;
        else if (!pointerIn && (Math.abs(ox[k]) > REST || Math.abs(oy[k]) > REST)) moving = true;
      }
    }
    if (!moving && !pointerIn) {
      ox.fill(0);
      oy.fill(0);
      vx.fill(0);
      vy.fill(0);
    }
    return moving;
  }

  function burst(x: number, y: number) {
    const r2 = BURST_R * BURST_R;
    for (let j = 0, k = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++, k++) {
        const dx = OFFSET + i * PITCH - x;
        const dy = OFFSET + j * PITCH - y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r2 || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        const f = (1 - d / BURST_R) * BURST_FORCE;
        vx[k] += (dx / d) * f;
        vy[k] += (dy / d) * f;
      }
    }
  }

  // ---------------------------------------------------------------- life
  function seed() {
    for (let k = 0; k < cells.length; k++) cells[k] = Math.random() < LIFE_DENSITY ? 1 : 0;
    generation = 0;
  }

  function step() {
    let population = 0;
    for (let j = 0; j < rows; j++) {
      const up = ((j - 1 + rows) % rows) * cols;
      const row = j * cols;
      const down = ((j + 1) % rows) * cols;
      for (let i = 0; i < cols; i++) {
        const l = (i - 1 + cols) % cols;
        const r = (i + 1) % cols;
        const n =
          cells[up + l] + cells[up + i] + cells[up + r] +
          cells[row + l] + cells[row + r] +
          cells[down + l] + cells[down + i] + cells[down + r];
        const alive = n === 3 || (n === 2 && cells[row + i] === 1) ? 1 : 0;
        scratch[row + i] = alive;
        population += alive;
      }
    }
    [cells, scratch] = [scratch, cells];
    generation++;
    if (population === 0) seed();
    say(`life · gen ${generation} · esc to exit`);
  }

  function paintCell(x: number, y: number) {
    const i = Math.round((x - OFFSET) / PITCH);
    const j = Math.round((y - OFFSET) / PITCH);
    if (i < 0 || j < 0 || i >= cols || j >= rows) return;
    cells[j * cols + i] = 1;
  }

  function setLife(on: boolean) {
    if (on === life) return;
    life = on;
    clearTimeout(hintTimer);
    if (life) {
      seed();
      ox.fill(0);
      oy.fill(0);
      vx.fill(0);
      vy.fill(0);
      say(reduced ? 'life · click to step · esc to exit' : 'life · esc to exit');
      live.textContent = 'Game of Life on. Press Escape to exit.';
    } else {
      say('');
      live.textContent = 'Game of Life off.';
    }
    draw();
    kick();
  }

  // ---------------------------------------------------------------- loop
  function frame(t: number) {
    raf = 0;
    if (!visible) return;
    let again = false;
    if (life) {
      if (!reduced) {
        if (t - lastStep >= LIFE_STEP_MS) {
          lastStep = t;
          step();
        }
        again = true;
      }
    } else {
      const rect = el.getBoundingClientRect();
      px = clientX - rect.left;
      py = clientY - rect.top;
      again = physics();
    }
    draw();
    if (again) kick();
  }

  function kick() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- events
  const onMove = (e: PointerEvent) => {
    clientX = e.clientX;
    clientY = e.clientY;
    pointerIn = e.pointerType === 'mouse' || e.pointerType === 'pen';
    if (life) {
      if (e.buttons || e.pointerType === 'mouse') {
        const rect = el.getBoundingClientRect();
        paintCell(e.clientX - rect.left, e.clientY - rect.top);
        if (reduced) draw();
      }
      return;
    }
    if (!reduced) kick();
  };
  const onLeave = () => {
    pointerIn = false;
    kick();
  };
  const onDown = (e: PointerEvent) => {
    if (reduced || life) return;
    const rect = el.getBoundingClientRect();
    burst(e.clientX - rect.left, e.clientY - rect.top);
    kick();
    // A quiet nudge for people who keep poking at it, once per session.
    if (++bursts === 4 && !hinted()) {
      say('type "life"');
      hintTimer = window.setTimeout(() => say(''), 2600);
    }
  };
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target?.closest(IGNORE)) return;
    if (life && reduced && e.detail === 1) {
      step();
      draw();
    }
    if (e.detail === 3) {
      window.getSelection()?.removeAllRanges();
      setLife(!life);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && life) {
      setLife(false);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target) || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-SECRET.length);
    if (typed === SECRET && visible) {
      typed = '';
      setLife(!life);
    }
  };

  const onTheme = () => {
    readColors();
    draw();
  };
  const onReduce = () => {
    reduced = reduceQuery.matches;
    if (life) say(reduced ? 'life · click to step · esc to exit' : 'life · esc to exit');
    kick();
  };

  let dprQuery: MediaQueryList | null = null;
  const onDpr = () => {
    dprQuery?.removeEventListener('change', onDpr);
    dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDpr);
    resize();
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  const ro = new ResizeObserver(resize);
  const mo = new MutationObserver(onTheme);

  // ---------------------------------------------------------------- mount
  const saved = {
    position: el.style.position,
    isolation: el.style.isolation,
    backgroundImage: el.style.backgroundImage,
    backgroundSize: el.style.backgroundSize,
  };
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.style.isolation = 'isolate';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  el.append(probe, canvas, status, live);

  readColors();
  resize();
  // The canvas now draws the dots; keep only the surface fade from the CSS.
  el.style.backgroundImage = 'linear-gradient(to bottom, var(--md-sys-color-surface), transparent 75%)';
  el.style.backgroundSize = '100% 100%';

  el.addEventListener('pointermove', onMove, { passive: true });
  el.addEventListener('pointerleave', onLeave, { passive: true });
  el.addEventListener('pointerdown', onDown, { passive: true });
  el.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  reduceQuery.addEventListener('change', onReduce);
  darkQuery.addEventListener('change', onTheme);
  mo.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  io.observe(el);
  ro.observe(el);
  onDpr();

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(hintTimer);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    reduceQuery.removeEventListener('change', onReduce);
    darkQuery.removeEventListener('change', onTheme);
    dprQuery?.removeEventListener('change', onDpr);
    mo.disconnect();
    io.disconnect();
    ro.disconnect();
    probe.remove();
    canvas.remove();
    status.remove();
    live.remove();
    Object.assign(el.style, saved);
  };
}
