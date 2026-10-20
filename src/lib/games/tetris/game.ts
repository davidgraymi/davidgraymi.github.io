/**
 * "Beat the bot": the controller behind TetrisVsBot.astro. Loaded with a
 * dynamic import only once the game scrolls into view, so the rest of the
 * page stays script-free.
 *
 * Two Tetris instances share a seed (so both see the same pieces in the same
 * order). The human plays with gravity and a lock delay; the agent picks a
 * placement with the trained value network, then walks its piece there at a
 * human-ish pace chosen by the speed setting.
 */
import { HEIGHT, SHAPES, WIDTH, Tetris, type Board } from './engine';
import { bestPlacement, type Plan } from './bot';

const MATCH_MS = 120_000;
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const DAS_MS = 150;
const ARR_MS = 45;
const SOFT_DROP_MS = 35;

/** Milliseconds the agent spends per piece, by speed setting. */
const BOT_PACE: Record<string, number> = { relaxed: 2200, even: 1300, flat: 550 };

type Phase = 'idle' | 'countdown' | 'running' | 'paused' | 'over';
type Side = 'human' | 'bot';

interface Palette {
  bg: string;
  grid: string;
  human: string;
  bot: string;
  text: string;
}

interface BotState {
  plan: Plan | null;
  /** Time since this piece spawned. */
  t: number;
  steps: Array<() => void>;
  stepIndex: number;
}

export function mount(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const field = $('[data-tvb-field]');
  const canvases = {
    human: $<HTMLCanvasElement>('[data-tvb-canvas="human"]'),
    bot: $<HTMLCanvasElement>('[data-tvb-canvas="bot"]'),
  };
  const nexts = {
    human: $<HTMLCanvasElement>('[data-tvb-next="human"]'),
    bot: $<HTMLCanvasElement>('[data-tvb-next="bot"]'),
  };
  const stat = (name: string) => $(`[data-tvb-stat="${name}"]`);
  const boardState = { human: $('[data-tvb-state="human"]'), bot: $('[data-tvb-state="bot"]') };
  const overlay = $('[data-tvb-overlay]');
  const message = $('[data-tvb-message]');
  const startBtn = $<HTMLButtonElement>('[data-tvb-start]');
  const pauseBtn = $<HTMLButtonElement>('[data-tvb-action="pause"]');
  const restartBtn = $<HTMLButtonElement>('[data-tvb-action="restart"]');
  const planToggle = $<HTMLInputElement>('[data-tvb-plan]');
  const live = $('[data-tvb-live]');
  const speedBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tvb-speed]'));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---- colours: read from token-backed utility classes so both themes just work ----
  let palette: Palette;
  function readPalette() {
    const color = (name: string) => {
      const el = root.querySelector(`[data-tvb-probe="${name}"]`);
      return el ? getComputedStyle(el).color : '#888';
    };
    palette = {
      bg: color('bg'),
      grid: color('grid'),
      human: color('human'),
      bot: color('bot'),
      text: color('text'),
    };
  }
  readPalette();

  // ---- state ----
  let phase: Phase = 'idle';
  let seed = 0;
  let human: Tetris;
  let bot: Tetris;
  let botState: BotState;
  let remaining = MATCH_MS;
  let countdown = 0;
  let speed = 'even';
  let gravityAcc = 0;
  let lockAcc = 0;
  let lockResets = 0;
  let softDrop = false;
  const held = { left: false, right: false };
  let dasDir: -1 | 0 | 1 = 0;
  let dasAcc = 0;
  let dasCharged = false;
  let raf = 0;
  let last = 0;

  function newMatch() {
    seed = Math.floor(Math.random() * 1e9);
    human = new Tetris(seed);
    bot = new Tetris(seed);
    remaining = MATCH_MS;
    gravityAcc = lockAcc = lockResets = 0;
    softDrop = false;
    held.left = held.right = false;
    dasDir = 0;
    startBotPiece();
    $('[data-tvb-seed]').textContent = String(seed % 100000).padStart(5, '0');
  }

  // ---- the agent ----
  function startBotPiece() {
    const plan = bot.over ? null : bestPlacement(bot.board, bot.piece.type);
    const steps: Array<() => void> = [];
    if (plan) {
      const n = SHAPES[bot.piece.type].length;
      const turns = (plan.rot - bot.piece.rot + n) % n;
      for (let i = 0; i < turns; i++) steps.push(() => void bot.rotate(1));
      // Horizontal steps are decided as they run, since a wall kick can shift x.
      const dx = plan.x - bot.piece.x;
      for (let i = 0; i < Math.abs(dx) + 2; i++) {
        steps.push(() => {
          const d = Math.sign(plan.x - bot.piece.x);
          if (d) bot.move(d, 0);
        });
      }
    }
    botState = { plan, t: 0, steps, stepIndex: 0 };
  }

  function updateBot(dt: number) {
    if (bot.over) return;
    const { plan } = botState;
    if (!plan) {
      bot.over = true;
      return;
    }
    botState.t += dt;
    const pace = BOT_PACE[speed];
    const think = pace * 0.35;
    const walk = pace * 0.5;
    if (!reducedMotion.matches && botState.t > think) {
      const due = Math.min(
        botState.steps.length,
        Math.floor(((botState.t - think) / walk) * (botState.steps.length + 1)),
      );
      while (botState.stepIndex < due) botState.steps[botState.stepIndex++]();
    }
    if (botState.t >= pace) {
      bot.place(plan.rot, plan.x, plan.y);
      if (bot.over) announce(`The agent topped out with ${bot.lines} lines.`);
      startBotPiece();
      refreshStats();
    }
  }

  // ---- the human ----
  const gravityMs = () => Math.max(90, 800 * Math.pow(0.82, Math.floor(human.lines / 10)));

  function afterHumanMove(moved: boolean) {
    if (moved && lockAcc > 0 && lockResets < MAX_LOCK_RESETS) {
      lockAcc = 0;
      lockResets++;
    }
  }

  function humanLock(cleared: number[]) {
    gravityAcc = lockAcc = lockResets = 0;
    if (cleared.length) announce(`${cleared.length === 1 ? 'Line' : `${cleared.length} lines`} cleared.`, true);
    if (human.over) announce(`You topped out with ${human.lines} lines.`);
    refreshStats();
  }

  function updateHuman(dt: number) {
    if (human.over) return;
    // Auto-repeat for held left/right.
    if (dasDir) {
      dasAcc += dt;
      if (!dasCharged && dasAcc >= DAS_MS) {
        dasCharged = true;
        dasAcc -= DAS_MS;
        afterHumanMove(human.move(dasDir, 0));
      }
      while (dasCharged && dasAcc >= ARR_MS) {
        dasAcc -= ARR_MS;
        afterHumanMove(human.move(dasDir, 0));
      }
    }
    gravityAcc += dt;
    const g = softDrop ? Math.min(SOFT_DROP_MS, gravityMs()) : gravityMs();
    while (gravityAcc >= g) {
      gravityAcc -= g;
      if (human.move(0, 1)) lockAcc = 0;
    }
    if (!human.fits(human.piece.rot, human.piece.x, human.piece.y + 1)) {
      lockAcc += dt;
      if (lockAcc >= LOCK_DELAY_MS) humanLock(human.lock());
    }
  }

  function act(action: string) {
    if (phase !== 'running' || human.over) return;
    switch (action) {
      case 'left':
        afterHumanMove(human.move(-1, 0));
        break;
      case 'right':
        afterHumanMove(human.move(1, 0));
        break;
      case 'cw':
        afterHumanMove(human.rotate(1));
        break;
      case 'ccw':
        afterHumanMove(human.rotate(-1));
        break;
      case 'drop':
        humanLock(human.hardDrop());
        break;
    }
    render();
  }

  function hold(dir: 'left' | 'right', down: boolean) {
    held[dir] = down;
    const want: -1 | 0 | 1 = held.left && !held.right ? -1 : held.right && !held.left ? 1 : 0;
    if (want !== dasDir) {
      dasDir = want;
      dasAcc = 0;
      dasCharged = false;
      if (down && want) act(dir);
    }
  }

  // ---- loop ----
  function frame(now: number) {
    const dt = Math.min(100, now - last);
    last = now;
    if (phase === 'countdown') {
      countdown -= dt;
      if (countdown <= 0) {
        phase = 'running';
        overlay.hidden = true;
        announce('Go.');
      } else {
        message.textContent = String(Math.ceil(countdown / 1000));
      }
    } else if (phase === 'running') {
      remaining = Math.max(0, remaining - dt);
      updateHuman(dt);
      updateBot(dt);
      if (remaining === 0 || (human.over && bot.over)) finish();
    }
    render();
    if (phase === 'running' || phase === 'countdown') raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    newMatch();
    phase = 'countdown';
    countdown = 3000;
    overlay.hidden = false;
    startBtn.hidden = true;
    message.textContent = '3';
    pauseBtn.disabled = false;
    setPauseLabel();
    refreshStats();
    field.focus({ preventScroll: true });
    announce('Match starting in 3 seconds. Same pieces, two minutes, most lines wins.');
    startLoop();
  }

  function pause() {
    if (phase !== 'running' && phase !== 'countdown') return;
    phase = 'paused';
    cancelAnimationFrame(raf);
    overlay.hidden = false;
    message.textContent = 'Paused';
    startBtn.hidden = false;
    startBtn.textContent = 'Resume';
    setPauseLabel();
    announce('Paused.');
  }

  function resume() {
    if (phase !== 'paused') return;
    phase = 'countdown';
    countdown = reducedMotion.matches ? 1 : 1000;
    startBtn.hidden = true;
    message.textContent = '1';
    setPauseLabel();
    field.focus({ preventScroll: true });
    startLoop();
  }

  function finish() {
    phase = 'over';
    cancelAnimationFrame(raf);
    const h = human.lines;
    const b = bot.lines;
    let verdict: string;
    if (h > b || (h === b && human.score > bot.score)) verdict = 'You beat the bot';
    else if (h === b && human.score === bot.score) verdict = 'Dead heat';
    else verdict = 'The bot wins';
    const text = `${verdict}: ${h} ${h === 1 ? 'line' : 'lines'} to ${b}.`;
    overlay.hidden = false;
    message.textContent = text;
    startBtn.hidden = false;
    startBtn.textContent = 'Rematch';
    pauseBtn.disabled = true;
    setPauseLabel();
    announce(text);
  }

  function setPauseLabel() {
    pauseBtn.textContent = phase === 'paused' ? 'Resume' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(phase === 'paused'));
  }

  // ---- output ----
  let lastPolite = 0;
  function announce(text: string, minor = false) {
    // Line clears can come thick and fast; don't flood screen readers.
    const now = performance.now();
    if (minor && now - lastPolite < 4000) return;
    lastPolite = now;
    live.textContent = text;
  }

  function refreshStats() {
    stat('human-lines').textContent = String(human.lines);
    stat('human-score').textContent = String(human.score);
    stat('bot-lines').textContent = String(bot.lines);
    stat('bot-score').textContent = String(bot.score);
    const v = botState.plan?.value;
    stat('bot-value').textContent = v === undefined ? '—' : v.toFixed(1);
    const lead = human.lines - bot.lines;
    stat('lead').textContent = lead === 0 ? 'Level' : lead > 0 ? `You +${lead}` : `Bot +${-lead}`;
    boardState.human.hidden = !human.over;
    boardState.bot.hidden = !bot.over;
  }

  let lastClock = '';
  function renderClock() {
    const s = Math.ceil(remaining / 1000);
    const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (text !== lastClock) stat('clock').textContent = lastClock = text;
  }

  function fit(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return canvas.getContext('2d')!;
  }

  function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, alpha: number) {
    const inset = Math.max(1, s * 0.06);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x * s + inset, y * s + inset, s - inset * 2, s - inset * 2);
  }

  function outlinePiece(
    ctx: CanvasRenderingContext2D,
    type: number,
    rot: number,
    px: number,
    py: number,
    s: number,
    color: string,
    dashed: boolean,
  ) {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.setLineDash(dashed ? [s * 0.18, s * 0.14] : []);
    const inset = Math.max(1.5, s * 0.12);
    for (const c of SHAPES[type][rot].cells) {
      ctx.strokeRect((px + c.x) * s + inset, (py + c.y) * s + inset, s - inset * 2, s - inset * 2);
    }
    ctx.setLineDash([]);
  }

  function drawBoard(side: Side) {
    const game = side === 'human' ? human : bot;
    const canvas = canvases[side];
    const ctx = fit(canvas);
    const s = canvas.width / WIDTH;
    const accent = palette[side];
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dot grid at cell corners, echoing the site's dot-field texture.
    ctx.fillStyle = palette.grid;
    const r = Math.max(0.75, s * 0.04);
    for (let y = 1; y < HEIGHT; y++) {
      for (let x = 1; x < WIDTH; x++) ctx.fillRect(x * s - r, y * s - r, r * 2, r * 2);
    }

    if (!game) return;
    drawStack(ctx, game.board, s, accent, game.over);
    if (game.over) return;

    const p = game.piece;
    if (side === 'human') {
      const gy = game.ghostY();
      if (gy !== p.y) outlinePiece(ctx, p.type, p.rot, p.x, gy, s, accent, false);
    } else if (planToggle.checked && botState.plan) {
      const { rot, x, y } = botState.plan;
      outlinePiece(ctx, p.type, rot, x, y, s, accent, true);
    }
    for (const c of SHAPES[p.type][p.rot].cells) drawCell(ctx, p.x + c.x, p.y + c.y, s, accent, 1);
    ctx.globalAlpha = 1;
  }

  function drawStack(ctx: CanvasRenderingContext2D, board: Board, s: number, accent: string, over: boolean) {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const v = board[y * WIDTH + x];
        // Vary the tint a little per piece type so the stack stays legible in one hue.
        if (v) drawCell(ctx, x, y, s, over ? palette.text : accent, (over ? 0.3 : 0.5) + (v % 3) * 0.12);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawNext(side: Side) {
    const game = side === 'human' ? human : bot;
    const canvas = nexts[side];
    const ctx = fit(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!game || game.over) return;
    const type = game.queue.peek(1)[0];
    const shape = SHAPES[type][0];
    const s = canvas.width / 4;
    const ox = (4 - shape.w) / 2;
    const oy = (canvas.height / s - shape.h) / 2;
    for (const c of shape.cells) drawCell(ctx, ox + c.x, oy + c.y, s, palette[side], 0.9);
    ctx.globalAlpha = 1;
  }

  function render() {
    drawBoard('human');
    drawBoard('bot');
    drawNext('human');
    drawNext('bot');
    if (human) renderClock();
  }

  // ---- input ----
  const KEYS: Record<string, string> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'cw',
    x: 'cw',
    X: 'cw',
    z: 'ccw',
    Z: 'ccw',
    ' ': 'drop',
    ArrowDown: 'soft',
  };

  field.addEventListener('keydown', (e) => {
    const action = KEYS[e.key];
    // Only when the board itself has focus, so Space on a button stays a click.
    if (!action || phase !== 'running' || e.target !== field) return;
    e.preventDefault();
    if (e.repeat && action !== 'soft') return;
    if (action === 'left' || action === 'right') hold(action, true);
    else if (action === 'soft') softDrop = true;
    else act(action);
  });
  field.addEventListener('keyup', (e) => {
    const action = KEYS[e.key];
    if (action === 'left' || action === 'right') hold(action, false);
    else if (action === 'soft') softDrop = false;
  });

  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'p' || e.key === 'P' || (e.key === 'Escape' && phase === 'running')) {
      e.preventDefault();
      if (phase === 'paused') resume();
      else pause();
    } else if ((e.key === 'Enter' || e.key === ' ') && e.target === field && (phase === 'idle' || phase === 'over')) {
      e.preventDefault();
      start();
    }
  });

  // Touch pad. Pointer events keep focus on the board and let left/right auto-repeat.
  root.querySelectorAll<HTMLButtonElement>('[data-tvb-pad]').forEach((btn) => {
    const action = btn.dataset.tvbPad!;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      if (action === 'left' || action === 'right') hold(action, true);
      else if (action === 'soft') softDrop = true;
      else act(action);
    });
    const release = () => {
      if (action === 'left' || action === 'right') hold(action, false);
      else if (action === 'soft') softDrop = false;
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    // Keyboard activation of a pad button (Enter/Space) still works as a single tap.
    btn.addEventListener('click', (e) => {
      if (e.detail !== 0) return;
      if (action === 'soft') act('drop');
      else act(action);
    });
  });

  startBtn.addEventListener('click', () => (phase === 'paused' ? resume() : start()));
  pauseBtn.addEventListener('click', () => (phase === 'paused' ? resume() : pause()));
  restartBtn.addEventListener('click', () => start());
  planToggle.addEventListener('change', render);

  speedBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      speed = btn.dataset.tvbSpeed!;
      speedBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }),
  );

  // Pause when the player leaves: tab hidden, or focus moves out of the game.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });
  root.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (phase === 'running' && (!next || !root.contains(next))) pause();
  });

  // Redraw on theme switches and resizes.
  const repaint = () => {
    readPalette();
    render();
  };
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint);
  new ResizeObserver(() => render()).observe(field);

  // Show a dealt (but not started) match so the boards aren't blank.
  newMatch();
  refreshStats();
  render();
  message.textContent = 'Ready when you are.';
  startBtn.disabled = false;
  root.dataset.tvbReady = '';
}
