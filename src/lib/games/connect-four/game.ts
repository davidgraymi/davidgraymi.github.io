// DOM wiring for "Four in a row" (src/components/games/FourInARow.astro).
// Loaded on demand; the model runs in ./worker.ts and streams each outer step,
// which redraws three things as it arrives:
//   - a bar over every column: the move head's probability for it
//   - a ring by the status line: how ready it is to stop (it plays at 50%)
//   - dots in the empty holes where its internal state moved most this step
import { Board } from './board';
import { chosenColumn, COLS, ROWS, type StepOutput } from './model';

const WEIGHTS_URL = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/games/connect-four/weights.f16.bin`;
const BAR_MAX_REM = 3.1;

const pct = (p: number) => (p >= 0.995 ? '100' : p < 0.005 ? '0' : (p * 100).toFixed(0));

export function mount(root: HTMLElement) {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const $$ = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const boardEl = $<HTMLElement>('[data-c4-board]');
  const colBtns = $$<HTMLButtonElement>('.c4-col');
  const cells = new Map($$<HTMLElement>('[data-cell]').map((el) => [el.dataset.cell!, el]));
  const heats = new Map([...cells].map(([k, el]) => [k, el.querySelector<HTMLElement>('.c4-heat')!]));
  const bars = $$<HTMLElement>('[data-bar]');
  const pcts = $$<HTMLElement>('[data-pct]');
  const ring = $<SVGCircleElement>('[data-c4-ring]');
  const ringLen = Number(ring.getAttribute('stroke-dasharray'));
  const stepEl = $<SVGTextElement>('[data-c4-step]');
  const statusEl = $<HTMLElement>('[data-c4-status]');
  const firstBtns = $$<HTMLButtonElement>('[data-c4-first]');
  const newBtn = $<HTMLButtonElement>('[data-c4-new]');

  let board = new Board();
  let humanFirst = true;
  let ready = false;
  let over = false;
  let thinking = false;
  let requestId = 0;
  let last: StepOutput | null = null;
  let totalMs = 0;

  const humanColour = () => (humanFirst ? 1 : 2);
  const humansTurn = () => !over && board.toMove === humanColour();

  // ---- worker ----
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'ready') {
      ready = true;
      newGame();
    } else if (m.type === 'error') {
      setStatus("The model didn't load. Reload the page to try again.");
    } else if (m.id === requestId && m.type === 'step') {
      totalMs += m.ms;
      last = m.out;
      showStep(m.out);
    } else if (m.id === requestId && m.type === 'done') {
      // let the last frame land before the disc drops
      setTimeout(() => m.id === requestId && commitModelMove(), 180);
    }
  };
  worker.postMessage({ type: 'load', url: WEIGHTS_URL });

  // ---- rendering ----
  function setStatus(main: string, dim = '') {
    statusEl.textContent = main;
    if (dim) {
      const span = document.createElement('span');
      span.dataset.dim = '';
      span.textContent = ` ${dim}`;
      statusEl.append(span);
    }
  }

  function renderBoard(win: [number, number][] | null = null) {
    const lastCol = board.moves.length ? board.moves.at(-1)! : -1;
    const lastRow = lastCol >= 0 ? board.heights[lastCol] - 1 : -1;
    const winSet = new Set((win ?? []).map(([r, c]) => `${r}-${c}`));
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const el = cells.get(`${r}-${c}`)!;
        const p = board.grid[r][c];
        if (p) {
          el.dataset.p = String(p);
          el.dataset.who = p === humanColour() ? 'human' : 'model';
        } else {
          delete el.dataset.p;
          delete el.dataset.who;
        }
        el.toggleAttribute('data-last', !win && r === lastRow && c === lastCol);
        el.toggleAttribute('data-win', winSet.has(`${r}-${c}`));
      }
    boardEl.toggleAttribute('data-over', over);
    colBtns.forEach((b, c) => {
      b.disabled = !ready || !humansTurn() || !board.canPlay(c);
      const h = board.heights[c];
      b.setAttribute('aria-label', `Column ${c + 1}${h >= ROWS ? ', full' : ''}`);
    });
  }

  function showStep(s: StepOutput | null) {
    const top = s ? chosenColumn(s) : -1;
    bars.forEach((bar, c) => {
      const p = s && board.canPlay(c) ? s.policy[c] : 0;
      bar.style.height = `max(3px, ${(p * BAR_MAX_REM).toFixed(3)}rem)`;
      bar.toggleAttribute('data-top', c === top);
      pcts[c].textContent = c === top ? `${pct(p)}%` : '';
      pcts[c].toggleAttribute('data-show', c === top);
    });
    const readiness = s ? Math.min(1, s.stopped / 0.5) : 0;
    ring.setAttribute('stroke-dashoffset', String(ringLen * (1 - readiness)));
    stepEl.textContent = s ? String(s.step) : '';

    if (s) {
      // Relative to this step's range, so the cells that moved most stand out.
      const max = Math.max(...s.change);
      const min = Math.min(...s.change);
      s.change.forEach((d, i) => {
        const r = ROWS - 1 - Math.floor(i / COLS);
        const t = max > min ? (d - min) / (max - min) : 0;
        const v = t < 0.45 ? 0 : ((t - 0.45) / 0.55) ** 1.5; // only the hottest few holes
        heats.get(`${r}-${i % COLS}`)!.style.opacity = String(0.95 * v);
      });
      setStatus('Thinking', `· leaning to column ${top + 1}`);
    } else heats.forEach((h) => (h.style.opacity = '0'));
  }

  // ---- flow ----
  function finishIfOver(r: number, c: number, who: 'human' | 'model'): boolean {
    const win = board.winLine(r, c);
    if (win || board.full()) {
      over = true;
      renderBoard(win);
      heats.forEach((h) => (h.style.opacity = '0'));
      if (!win) setStatus('A draw.', 'Board full.');
      else if (who === 'human') setStatus('You win.', 'Not many people do.');
      else setStatus('The model wins.', 'Try again?');
      return true;
    }
    return false;
  }

  function humanPlay(c: number) {
    if (!ready || thinking || !humansTurn() || !board.canPlay(c)) return;
    const r = board.play(c);
    renderBoard();
    if (finishIfOver(r, c, 'human')) return;
    modelTurn();
  }

  function modelTurn() {
    thinking = true;
    last = null;
    totalMs = 0;
    requestId++;
    renderBoard();
    showStep(null);
    setStatus('Thinking');
    worker.postMessage({ type: 'think', id: requestId, tokens: board.tokens() });
  }

  function commitModelMove() {
    if (!thinking || !last) return;
    thinking = false;
    const s = last;
    const c = chosenColumn(s);
    const r = board.play(c);
    heats.forEach((h) => (h.style.opacity = '0'));
    renderBoard();
    if (finishIfOver(r, c, 'model')) return;
    setStatus(
      `Column ${c + 1}.`,
      `${s.step} step${s.step === 1 ? '' : 's'} in ${(totalMs / 1000).toFixed(2)} s. Your move.`,
    );
  }

  function newGame() {
    worker.postMessage({ type: 'cancel', id: requestId });
    requestId++;
    board = new Board();
    over = false;
    thinking = false;
    last = null;
    renderBoard();
    showStep(null);
    if (!ready) return;
    if (humanFirst) setStatus('Your move.', 'Pick a column, or press 1–7.');
    else modelTurn();
  }

  // ---- input ----
  colBtns.forEach((b, c) => b.addEventListener('click', () => humanPlay(c)));
  // Keys 1-7 work anywhere on the page while the board is on screen.
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable], dialog[open]'))
      return;
    const rect = root.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const n = Number(e.key);
    if (n >= 1 && n <= COLS) {
      e.preventDefault();
      humanPlay(n - 1);
    }
  });
  firstBtns.forEach((b) =>
    b.addEventListener('click', () => {
      firstBtns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      humanFirst = b.dataset.c4First === 'human';
      newGame();
    }),
  );
  newBtn.addEventListener('click', newGame);
}
