/**
 * "Route the robots": board editor, animated LaCAM solve, and a manual
 * "beat the solver" mode. Loaded lazily by RouteTheRobots.astro once the
 * widget scrolls into view.
 */
import { HEIGHT, MAX_ROBOTS, PRESETS, WIDTH, type Preset } from './presets';
import { neighbours, planCosts, solve, type Problem, type SolveResult } from './solver';

type Mode = 'edit' | 'watch' | 'play';
type Tool = 'wall' | 'start' | 'goal' | 'erase';

interface Slot {
  start: number | null;
  goal: number | null;
}

const SVG = 'http://www.w3.org/2000/svg';
const CELLS = WIDTH * HEIGHT;
const STEP_MS = 340;
const TOOL_KEYS: Record<string, Tool> = { w: 'wall', s: 'start', g: 'goal', x: 'erase' };
const DIRS: Record<string, number> = { ArrowUp: -WIDTH, ArrowDown: WIDTH, ArrowLeft: -1, ArrowRight: 1 };

const rowOf = (v: number) => Math.floor(v / WIDTH);
const colOf = (v: number) => v % WIDTH;
const where = (v: number) => `row ${rowOf(v) + 1}, column ${colOf(v) + 1}`;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function mount(root: HTMLElement) {
  if (root.dataset.rtrMounted) return;
  root.dataset.rtrMounted = 'true';

  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T & Element>(sel) as T;
  const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T & Element>(sel)) as T[];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const board = $('[data-board]');
  const status = $('[data-status]');
  const scrub = $<HTMLInputElement>('[data-scrub]');
  const scrubLabel = $('[data-scrub-label]');
  const playBtn = $<HTMLButtonElement>('[data-action="toggle-play"]');
  const presetBlurb = $('[data-preset-blurb]');

  // ---- state -------------------------------------------------------------
  let walls: boolean[] = new Array(CELLS).fill(false);
  let slots: Slot[] = Array.from({ length: MAX_ROBOTS }, () => ({ start: null, goal: null }));
  let active = 0;
  let tool: Tool = 'wall';
  let mode: Mode = 'edit';
  let cursor = 0;
  let presetId: string | null = null;

  /** Solver output for the current board; cleared on any edit. */
  let solution: (SolveResult & { slots: number[] }) | null = null;

  let watchT = 0;
  let watching = false;
  let raf = 0;
  let lastFrame = 0;

  let history: number[][] = [];
  let queued: (number | null)[] = [];
  let selected = 0;
  let finished = false;
  let tween: { from: number[]; start: number } | null = null;

  // ---- board scaffolding -------------------------------------------------
  board.textContent = '';
  const cellEls: HTMLElement[] = [];
  for (let r = 0; r < HEIGHT; r++) {
    const row = document.createElement('div');
    row.setAttribute('role', 'row');
    row.className = 'contents';
    for (let c = 0; c < WIDTH; c++) {
      const cell = document.createElement('div');
      const v = r * WIDTH + c;
      cell.setAttribute('role', 'gridcell');
      cell.id = `${root.id}-c${v}`;
      cell.dataset.cell = String(v);
      cell.className = 'rtr-cell';
      row.append(cell);
      cellEls.push(cell);
    }
    board.append(row);
  }
  const overlay = svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, class: 'rtr-overlay', 'aria-hidden': 'true' });
  const gTrails = svg('g', {});
  const gGoals = svg('g', {});
  const gQueue = svg('g', {});
  const gRobots = svg('g', {});
  overlay.append(gTrails, gGoals, gQueue, gRobots);
  board.parentElement!.append(overlay);

  // ---- helpers -----------------------------------------------------------
  const placed = () => slots.map((s, i) => i).filter((i) => slots[i].start !== null && slots[i].goal !== null);
  const say = (msg: string) => (status.textContent = msg);
  const colour = (slot: number) => `var(--rtr-${slot})`;

  function problem(ids = placed()): Problem {
    return { width: WIDTH, height: HEIGHT, walls, starts: ids.map((i) => slots[i].start!), goals: ids.map((i) => slots[i].goal!) };
  }

  function validate(): string | null {
    const half = slots.findIndex((s) => (s.start === null) !== (s.goal === null));
    if (half !== -1) return `Robot ${half + 1} needs ${slots[half].start === null ? 'a start' : 'a goal'}.`;
    if (placed().length === 0) return 'Place at least one robot and its goal first.';
    return null;
  }

  function ensureSolution(): boolean {
    const err = validate();
    if (err) {
      say(err);
      return false;
    }
    if (!solution) {
      const ids = placed();
      solution = { ...solve(problem(ids)), slots: ids };
    }
    if (!solution.ok && solution.reason === 'unreachable') {
      say(`Robot ${solution.slots[solution.agent ?? 0] + 1} can't reach its goal — walls are in the way.`);
      return false;
    }
    return true;
  }

  function invalidate() {
    solution = null;
    presetId = null;
    renderPresets();
  }

  function loadPreset(p: Preset) {
    walls = p.map.join('').split('').map((ch) => ch === '#');
    slots = Array.from({ length: MAX_ROBOTS }, (_, i) => {
      const r = p.robots[i];
      return r ? { start: r[0] * WIDTH + r[1], goal: r[2] * WIDTH + r[3] } : { start: null, goal: null };
    });
    active = 0;
    solution = null;
    presetId = p.id;
    setMode('edit');
    presetBlurb.textContent = p.blurb;
    renderPresets();
    say(`Loaded “${p.name}”. ${p.robots.length} robots.`);
  }

  // ---- editing -----------------------------------------------------------
  let paint: boolean | null = null;

  function apply(v: number, dragging = false) {
    const s = slots[active];
    const occupiedBy = (key: 'start' | 'goal') => slots.findIndex((o, i) => i !== active && o[key] === v);
    const hasRobotBits = slots.some((o) => o.start === v || o.goal === v);
    switch (tool) {
      case 'wall': {
        if (hasRobotBits) {
          if (!dragging) say(`Can't build a wall on a robot or goal (${where(v)}).`);
          return;
        }
        if (paint === null) paint = !walls[v];
        if (walls[v] === paint) return;
        walls[v] = paint;
        break;
      }
      case 'erase': {
        if (!walls[v] && !hasRobotBits) return;
        walls[v] = false;
        slots.forEach((o) => {
          if (o.start === v) o.start = null;
          if (o.goal === v) o.goal = null;
        });
        break;
      }
      case 'start':
      case 'goal': {
        if (dragging) return;
        const other = occupiedBy(tool);
        if (other !== -1) {
          say(`That cell already holds robot ${other + 1}'s ${tool}.`);
          return;
        }
        walls[v] = false;
        s[tool] = v;
        const next = tool === 'start' && s.goal === null ? 'goal' : null;
        say(`Robot ${active + 1} ${tool} set at ${where(v)}.${next ? ' Now place its goal.' : ''}`);
        if (next) setTool(next);
        break;
      }
    }
    invalidate();
    render();
  }

  function setTool(t: Tool) {
    tool = t;
    root.dataset.tool = t;
    $$<HTMLButtonElement>('[data-tool]').forEach((b) => {
      const on = b.dataset.tool === t;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function setActive(i: number) {
    active = i;
    if (mode === 'play') {
      selected = i;
    }
    renderRobots();
    render();
  }

  // ---- modes -------------------------------------------------------------
  function setMode(m: Mode) {
    stopWatch();
    mode = m;
    root.dataset.mode = m;
    $$('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== m));
    $$('[data-edit-only]').forEach((p) => (p.hidden = m !== 'edit'));
    tween = null;
    renderStats();
    render();
  }

  function startWatch() {
    if (!ensureSolution()) return;
    if (!solution!.ok) {
      say('The solver ran out of budget on this one. Try fewer robots or more room.');
      return;
    }
    setMode('watch');
    const T = solution!.plan.length - 1;
    scrub.max = String(T);
    watchT = 0;
    say(`Solved: makespan ${solution!.makespan}, sum of costs ${solution!.sumOfCosts}. Playing.`);
    playWatch();
  }

  function playWatch() {
    if (!solution?.ok) return;
    const T = solution.plan.length - 1;
    if (watchT >= T) watchT = 0;
    watching = true;
    playBtn.textContent = 'Pause';
    lastFrame = performance.now();
    cancelAnimationFrame(raf);
    const frame = (now: number) => {
      if (!watching) return;
      const dt = Math.max(0, now - lastFrame);
      if (reducedMotion.matches) {
        // No tweening: hop a whole step at a time.
        if (dt < STEP_MS * 1.5) {
          raf = requestAnimationFrame(frame);
          return;
        }
        watchT = Math.floor(watchT) + 1;
      } else {
        watchT += dt / STEP_MS;
      }
      lastFrame = now;
      if (watchT >= T) {
        watchT = T;
        stopWatch();
      }
      render();
      if (watching) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  function stopWatch() {
    watching = false;
    cancelAnimationFrame(raf);
    playBtn.textContent = 'Play';
  }

  function startPlay() {
    if (!ensureSolution()) return;
    const ids = placed();
    history = [ids.map((i) => slots[i].start!)];
    queued = ids.map(() => null);
    selected = active;
    if (!ids.includes(selected)) selected = ids[0];
    finished = false;
    setMode('play');
    const target = solution!.ok ? ` The solver needs makespan ${solution!.makespan}, sum of costs ${solution!.sumOfCosts}.` : '';
    say(`Your turn. Pick a robot, choose a move for it, then press Step.${target}`);
  }

  // ---- manual play -------------------------------------------------------
  const ids = () => solution?.slots ?? placed();
  const now = () => history[history.length - 1];

  function queue(dir: number | 'wait') {
    if (finished) return;
    const k = ids().indexOf(selected);
    if (k === -1) return;
    const from = now()[k];
    if (dir === 'wait') {
      queued[k] = null;
      say(`Robot ${selected + 1} will wait.`);
      render();
      return;
    }
    const to = from + dir;
    const ok = neighbours({ width: WIDTH, height: HEIGHT, walls }, from).includes(to);
    if (!ok) {
      say(`Robot ${selected + 1} can't move that way.`);
      return;
    }
    queued[k] = to;
    say(`Robot ${selected + 1} will move to ${where(to)}.`);
    render();
  }

  function step() {
    if (finished) return;
    const cur = now();
    const next = cur.map((v, k) => queued[k] ?? v);
    const label = (k: number) => ids()[k] + 1;
    for (let a = 0; a < next.length; a++) {
      for (let b = a + 1; b < next.length; b++) {
        if (next[a] === next[b]) {
          say(`Robots ${label(a)} and ${label(b)} would collide at ${where(next[a])}. Change one of their moves.`);
          return;
        }
        if (next[a] === cur[b] && next[b] === cur[a]) {
          say(`Robots ${label(a)} and ${label(b)} can't swap places through each other.`);
          return;
        }
      }
    }
    tween = reducedMotion.matches ? null : { from: cur, start: performance.now() };
    history.push(next);
    queued = queued.map(() => null);
    const goals = ids().map((i) => slots[i].goal!);
    if (next.every((v, k) => v === goals[k])) {
      finished = true;
      say(verdict());
    } else {
      say(`Step ${history.length - 1} done.`);
    }
    renderStats();
    animateTween();
  }

  function undo() {
    if (history.length <= 1) return;
    history.pop();
    finished = false;
    queued = queued.map(() => null);
    tween = null;
    say(`Back to step ${history.length - 1}.`);
    renderStats();
    render();
  }

  function restart() {
    history = history.slice(0, 1);
    queued = queued.map(() => null);
    finished = false;
    tween = null;
    say('Back to the start.');
    renderStats();
    render();
  }

  const yourMoves = () => history.slice(1).reduce((n, cfg, t) => n + cfg.filter((v, k) => v !== history[t][k]).length, 0);
  const yourCosts = () => planCosts(history, ids().map((i) => slots[i].goal!));

  function verdict(): string {
    const you = yourCosts();
    if (!solution?.ok) return `All robots home: makespan ${you.makespan}, sum of costs ${you.sumOfCosts}. The solver gave up on this one, so you win outright.`;
    const dm = solution.makespan - you.makespan;
    const ds = solution.sumOfCosts - you.sumOfCosts;
    const part = (d: number, what: string) => (d > 0 ? `beat its ${what} by ${d}` : d === 0 ? `matched its ${what}` : `were ${-d} over its ${what}`);
    const headline = dm >= 0 && ds >= 0 && (dm > 0 || ds > 0) ? 'You beat the solver!' : dm === 0 && ds === 0 ? 'A tie with the solver.' : 'All robots home.';
    return `${headline} You ${part(dm, 'makespan')} and ${part(ds, 'sum of costs')}.`;
  }

  function animateTween() {
    if (!tween) {
      render();
      return;
    }
    const frame = () => {
      render();
      if (tween && performance.now() - tween.start < STEP_MS * 0.6) requestAnimationFrame(frame);
      else {
        tween = null;
        render();
      }
    };
    requestAnimationFrame(frame);
  }

  // ---- rendering ---------------------------------------------------------
  function positions(): { slot: number; at: [number, number]; cell: number }[] {
    const xy = (v: number): [number, number] => [colOf(v) + 0.5, rowOf(v) + 0.5];
    if (mode === 'edit') {
      return slots.flatMap((s, slot) => (s.start === null ? [] : [{ slot, at: xy(s.start), cell: s.start }]));
    }
    if (mode === 'watch' && solution?.ok) {
      const T = solution.plan.length - 1;
      const t0 = Math.min(Math.floor(watchT), T);
      const t1 = Math.min(t0 + 1, T);
      const f = watchT - t0;
      const plan = solution.plan;
      return solution.slots.map((slot, k) => {
        const a = xy(plan[t0][k]);
        const b = xy(plan[t1][k]);
        return { slot, at: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], cell: plan[Math.round(watchT)][k] };
      });
    }
    const cur = now();
    const f = tween ? Math.min(1, (performance.now() - tween.start) / (STEP_MS * 0.6)) : 1;
    const e = 1 - (1 - f) * (1 - f);
    return ids().map((slot, k) => {
      const a = xy(tween ? tween.from[k] : cur[k]);
      const b = xy(cur[k]);
      return { slot, at: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e], cell: cur[k] };
    });
  }

  function render() {
    if (mode === 'play') cursor = now()[Math.max(0, ids().indexOf(selected))];
    const robots = positions();
    const atCell = new Map(robots.map((r) => [r.cell, r.slot]));
    const trailSlots = mode === 'watch' ? solution?.slots ?? [] : mode === 'play' ? ids() : [];

    // cells
    cellEls.forEach((el, v) => {
      el.classList.toggle('is-wall', walls[v]);
      el.classList.toggle('is-cursor', v === cursor);
      const bits = [walls[v] ? 'wall' : 'floor'];
      const r = atCell.get(v);
      if (r !== undefined) bits.push(`robot ${r + 1}`);
      slots.forEach((s, i) => {
        if (mode === 'edit' && s.start === v && r !== i) bits.push(`robot ${i + 1} start`);
        if (s.goal === v) bits.push(`robot ${i + 1} goal`);
      });
      el.setAttribute('aria-label', `${where(v)}: ${bits.join(', ')}`);
      el.setAttribute('aria-selected', String(v === cursor));
    });
    board.setAttribute('aria-activedescendant', cellEls[cursor].id);

    // goals
    gGoals.textContent = '';
    slots.forEach((s, i) => {
      if (s.goal === null) return;
      if (mode !== 'edit' && !trailSlots.includes(i)) return;
      const cx = colOf(s.goal) + 0.5;
      const cy = rowOf(s.goal) + 0.5;
      gGoals.append(
        svg('rect', { x: cx - 0.36, y: cy - 0.36, width: 0.72, height: 0.72, rx: 0.08, class: 'rtr-goal', stroke: colour(i) }),
        Object.assign(svg('text', { x: cx, y: cy, class: 'rtr-goal-label', fill: colour(i) }), { textContent: String(i + 1) }),
      );
    });

    // trails
    gTrails.textContent = '';
    const trail = (slot: number, pts: number[], tip: [number, number]) => {
      const coords = pts.map((v) => `${colOf(v) + 0.5},${rowOf(v) + 0.5}`);
      coords.push(`${tip[0]},${tip[1]}`);
      gTrails.append(svg('polyline', { points: coords.join(' '), class: 'rtr-trail', stroke: colour(slot) }));
    };
    if (mode === 'watch' && solution?.ok) {
      const upto = Math.floor(watchT);
      const plan = solution.plan;
      solution.slots.forEach((slot, k) => trail(slot, plan.slice(0, upto + 1).map((c) => c[k]), robots[k].at));
    } else if (mode === 'play') {
      ids().forEach((slot, k) => trail(slot, history.slice(0, tween ? -1 : undefined).map((c) => c[k]), robots[k].at));
    }

    // queued moves (play)
    gQueue.textContent = '';
    if (mode === 'play' && !tween) {
      queued.forEach((to, k) => {
        if (to === null) return;
        const slot = ids()[k];
        const from = now()[k];
        const [x0, y0] = [colOf(from) + 0.5, rowOf(from) + 0.5];
        const [x1, y1] = [colOf(to) + 0.5, rowOf(to) + 0.5];
        gQueue.append(
          svg('line', { x1: x0 + (x1 - x0) * 0.4, y1: y0 + (y1 - y0) * 0.4, x2: x1, y2: y1, class: 'rtr-intent', stroke: colour(slot) }),
          svg('circle', { cx: x1, cy: y1, r: 0.3, class: 'rtr-ghost', stroke: colour(slot) }),
        );
      });
    }

    // robots
    gRobots.textContent = '';
    robots.forEach(({ slot, at }) => {
      const g = svg('g', { transform: `translate(${at[0]} ${at[1]})` });
      const isSel = (mode === 'play' && slot === selected) || (mode === 'edit' && slot === active);
      if (isSel) g.append(svg('circle', { r: 0.44, class: 'rtr-selected' }));
      g.append(svg('circle', { r: 0.32, class: 'rtr-robot', fill: colour(slot) }));
      g.append(Object.assign(svg('text', { class: 'rtr-robot-label' }), { textContent: String(slot + 1) }));
      gRobots.append(g);
    });

    if (mode === 'watch' && solution?.ok) {
      scrub.value = String(watchT);
      const t = Math.round(watchT);
      scrubLabel.textContent = `t = ${t} / ${solution.plan.length - 1}`;
      scrub.setAttribute('aria-valuetext', `Timestep ${t} of ${solution.plan.length - 1}`);
    }
    if (mode === 'play') renderStats();
  }

  function renderRobots() {
    $$<HTMLButtonElement>('[data-robot]').forEach((b) => {
      const i = Number(b.dataset.robot);
      const s = slots[i];
      const on = mode === 'play' ? i === selected : i === active;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('active', on);
      const state = s.start !== null && s.goal !== null ? 'placed' : s.start !== null ? 'needs a goal' : s.goal !== null ? 'needs a start' : 'empty';
      b.setAttribute('aria-label', `Robot ${i + 1}, ${state}`);
      b.classList.toggle('is-empty', state === 'empty');
      if (mode === 'play') b.hidden = !ids().includes(i);
      else b.hidden = false;
    });
    $<HTMLButtonElement>('[data-action="remove"]').textContent = `Remove robot ${active + 1}`;
  }

  function renderPresets() {
    $$<HTMLButtonElement>('[data-preset]').forEach((b) => {
      const on = b.dataset.preset === presetId;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (!presetId) presetBlurb.textContent = 'Your own puzzle. Draw walls, then place a start and goal for each robot.';
  }

  function renderStats() {
    const set = (k: string, v: string | number) => {
      const el = $(`[data-stat="${k}"]`);
      if (el) el.textContent = String(v);
    };
    const ok = solution?.ok ? solution : null;
    set('solver-makespan', ok ? ok.makespan : '—');
    set('solver-soc', ok ? ok.sumOfCosts : '—');
    set('solver-configs', solution ? solution.stats.configs : '—');
    if (mode === 'play') {
      set('you-steps', history.length - 1);
      set('you-soc', finished ? yourCosts().sumOfCosts : '—');
      set('you-moves', yourMoves());
    } else {
      set('you-steps', '—');
      set('you-soc', '—');
      set('you-moves', '—');
    }
    renderRobots();
  }

  // ---- input -------------------------------------------------------------
  function cellFromEvent(e: PointerEvent): number | null {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]');
    return el && board.contains(el) ? Number(el.dataset.cell) : null;
  }

  board.addEventListener('pointerdown', (e) => {
    const v = cellFromEvent(e);
    if (v === null) return;
    cursor = v;
    if (mode === 'edit') {
      paint = null;
      apply(v);
      if (tool === 'wall' || tool === 'erase') board.setPointerCapture(e.pointerId);
    } else if (mode === 'play') {
      playClick(v);
    }
    render();
  });
  board.addEventListener('pointermove', (e) => {
    if (mode !== 'edit' || !board.hasPointerCapture(e.pointerId)) return;
    const v = cellFromEvent(e);
    if (v !== null && v !== cursor) {
      cursor = v;
      apply(v, true);
    }
  });
  const endPaint = () => (paint = null);
  board.addEventListener('pointerup', endPaint);
  board.addEventListener('pointercancel', endPaint);

  function playClick(v: number) {
    const k = now().indexOf(v);
    if (k !== -1 && ids()[k] !== selected) {
      selected = ids()[k];
      say(`Robot ${selected + 1} selected.`);
      renderRobots();
      return;
    }
    const sk = ids().indexOf(selected);
    const from = now()[sk];
    if (v === from) queue('wait');
    else queue(v - from);
  }

  board.addEventListener('keydown', (e) => {
    const key = e.key;
    if (/^[1-6]$/.test(key)) {
      const i = Number(key) - 1;
      if (mode === 'play') {
        if (!ids().includes(i)) return;
        selected = i;
        cursor = now()[ids().indexOf(i)];
        say(`Robot ${i + 1} selected.`);
      } else if (mode === 'edit') {
        setActive(i);
        say(`Robot ${i + 1} selected.`);
      }
      e.preventDefault();
      render();
      return;
    }
    if (mode === 'edit') {
      if (key in DIRS) {
        const d = DIRS[key];
        const to = cursor + d;
        if (to >= 0 && to < CELLS && (Math.abs(d) === WIDTH || rowOf(to) === rowOf(cursor))) cursor = to;
        e.preventDefault();
        render();
      } else if (key === 'Enter' || key === ' ') {
        paint = null;
        apply(cursor);
        e.preventDefault();
      } else if (TOOL_KEYS[key.toLowerCase()]) {
        setTool(TOOL_KEYS[key.toLowerCase()]);
        say(`${tool[0].toUpperCase()}${tool.slice(1)} tool.`);
        e.preventDefault();
      }
    } else if (mode === 'play') {
      if (key in DIRS) {
        queue(DIRS[key]);
        e.preventDefault();
      } else if (key === '.') {
        queue('wait');
        e.preventDefault();
      } else if (key === 'Enter' || key === ' ') {
        step();
        e.preventDefault();
      } else if (key === 'Backspace' || key.toLowerCase() === 'u') {
        undo();
        e.preventDefault();
      }
    } else if (mode === 'watch') {
      if (key === ' ' || key === 'Enter') {
        watching ? stopWatch() : playWatch();
        e.preventDefault();
      } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        stopWatch();
        watchT = Math.max(0, Math.min(Number(scrub.max), Math.round(watchT) + (key === 'ArrowLeft' ? -1 : 1)));
        render();
        e.preventDefault();
      }
    }
  });

  root.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!btn || !root.contains(btn)) return;
    if (btn.dataset.preset) {
      const p = PRESETS.find((x) => x.id === btn.dataset.preset);
      if (p) loadPreset(p);
      return;
    }
    if (btn.dataset.tool) {
      setTool(btn.dataset.tool as Tool);
      return;
    }
    if (btn.dataset.robot) {
      const i = Number(btn.dataset.robot);
      if (mode === 'play') {
        selected = i;
        say(`Robot ${i + 1} selected.`);
        renderRobots();
        render();
      } else {
        setActive(i);
        const s = slots[i];
        if (s.start === null) setTool('start');
        else if (s.goal === null) setTool('goal');
      }
      return;
    }
    if (btn.dataset.move) {
      const m = btn.dataset.move;
      queue(m === 'wait' ? 'wait' : DIRS[m]);
      return;
    }
    switch (btn.dataset.action) {
      case 'solve':
        startWatch();
        break;
      case 'play':
        startPlay();
        break;
      case 'edit':
        setMode('edit');
        say('Editing. Change the board, then solve again.');
        break;
      case 'toggle-play':
        watching ? stopWatch() : playWatch();
        break;
      case 'step':
        step();
        break;
      case 'undo':
        undo();
        break;
      case 'restart':
        restart();
        break;
      case 'remove':
        slots[active] = { start: null, goal: null };
        invalidate();
        say(`Robot ${active + 1} removed.`);
        renderRobots();
        render();
        break;
      case 'clear':
        walls = new Array(CELLS).fill(false);
        slots = slots.map(() => ({ start: null, goal: null }));
        active = 0;
        invalidate();
        setTool('start');
        say('Board cleared. Place robot 1’s start.');
        renderRobots();
        render();
        break;
    }
  });

  scrub.addEventListener('input', () => {
    stopWatch();
    watchT = Number(scrub.value);
    render();
  });

  // ---- go ----------------------------------------------------------------
  root.querySelector('[data-loading]')?.remove();
  $$('[data-ui]').forEach((el) => (el.hidden = false));
  setTool('wall');
  loadPreset(PRESETS[0]);
}
