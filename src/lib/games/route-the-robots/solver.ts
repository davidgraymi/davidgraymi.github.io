/**
 * A small LaCAM solver for multi-agent path finding on a 4-connected grid.
 *
 * Same shape as the solver described on the LaCAM work page: a depth-first
 * search over joint configurations, where each configuration lazily grows a
 * breadth-first constraint tree. The difference is the configuration
 * generator — this one uses PIBT (priority inheritance with backtracking),
 * the variant from the published paper, instead of a plain greedy assignment.
 *
 * Cells are flat indices (row * width + col). A solution is a list of
 * configurations, one per timestep, each holding one cell per agent.
 */

export interface Problem {
  width: number;
  height: number;
  /** true = wall, indexed by cell */
  walls: boolean[];
  starts: number[];
  goals: number[];
}

export interface SolveStats {
  /** high-level (configuration) nodes created */
  configs: number;
  /** low-level (constraint) nodes popped */
  constraints: number;
  ms: number;
}

export type SolveResult =
  | { ok: true; plan: number[][]; makespan: number; sumOfCosts: number; stats: SolveStats }
  | { ok: false; reason: 'unreachable' | 'limit'; agent?: number; stats: SolveStats };

/** Seeded PRNG (mulberry32) so a given board always solves the same way. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function neighbours(p: Pick<Problem, 'width' | 'height' | 'walls'>, v: number): number[] {
  const { width, height, walls } = p;
  const r = Math.floor(v / width);
  const c = v % width;
  const out: number[] = [];
  if (r > 0 && !walls[v - width]) out.push(v - width);
  if (c < width - 1 && !walls[v + 1]) out.push(v + 1);
  if (r < height - 1 && !walls[v + width]) out.push(v + width);
  if (c > 0 && !walls[v - 1]) out.push(v - 1);
  return out;
}

/** BFS distance from `goal` to every cell (Infinity where unreachable). */
export function distanceField(p: Problem, goal: number): number[] {
  const d = new Array<number>(p.width * p.height).fill(Infinity);
  d[goal] = 0;
  const q = [goal];
  for (let h = 0; h < q.length; h++) {
    const v = q[h];
    for (const u of neighbours(p, v)) {
      if (d[u] === Infinity) {
        d[u] = d[v] + 1;
        q.push(u);
      }
    }
  }
  return d;
}

/** Makespan and sum-of-costs for a plan (each agent's cost is when it last arrives at its goal). */
export function planCosts(plan: number[][], goals: number[]) {
  const T = plan.length - 1;
  let sum = 0;
  let makespan = 0;
  goals.forEach((g, i) => {
    let cost = 0;
    for (let t = T; t >= 0; t--) {
      if (plan[t][i] !== g) {
        cost = t + 1;
        break;
      }
    }
    sum += cost;
    makespan = Math.max(makespan, cost);
  });
  return { makespan, sumOfCosts: sum };
}

interface Constraint {
  parent: Constraint | null;
  who: number;
  where: number;
  depth: number;
}

interface HighNode {
  config: number[];
  parent: HighNode | null;
  tree: Constraint[];
  head: number;
  order: number[];
  priorities: number[];
}

const key = (c: number[]) => c.join(',');

function solveOnce(p: Problem, dist: number[][], seed: number, budget: { nodes: number; deadline: number }, stats: SolveStats): number[][] | null {
  const n = p.starts.length;
  const cells = p.width * p.height;
  const rand = rng(seed);
  const nbrs: number[][] = [];
  for (let v = 0; v < cells; v++) nbrs[v] = p.walls[v] ? [] : neighbours(p, v);

  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const isGoal = (c: number[]) => c.every((v, i) => v === p.goals[i]);

  const makeNode = (config: number[], parent: HighNode | null): HighNode => {
    // PIBT priorities: agents still travelling accumulate urgency; agents at
    // their goal drop back to a small tie-breaker.
    const priorities = config.map((v, i) => {
      const tie = dist[i][p.starts[i]] / (cells * 4) + i / (cells * 64);
      if (!parent) return tie;
      return v === p.goals[i] ? parent.priorities[i] - Math.floor(parent.priorities[i]) : parent.priorities[i] + 1;
    });
    const order = [...Array(n).keys()].sort((a, b) => priorities[b] - priorities[a]);
    stats.configs++;
    return { config, parent, tree: [{ parent: null, who: -1, where: -1, depth: 0 }], head: 0, order, priorities };
  };

  // Scratch buffers for the configuration generator.
  const occNow = new Int32Array(cells).fill(-1);
  const occNext = new Int32Array(cells).fill(-1);
  const next = new Int32Array(n);

  function pibt(from: number[], ai: number, aj: number): boolean {
    const here = from[ai];
    const cand = shuffle([here, ...nbrs[here]]);
    // Closest to goal first; on ties prefer a cell nobody stands on now.
    cand.sort((a, b) => dist[ai][a] - dist[ai][b] || (occNow[a] === -1 ? 0 : 1) - (occNow[b] === -1 ? 0 : 1));
    for (const u of cand) {
      if (occNext[u] !== -1) continue;
      const ak = occNow[u];
      if (aj !== -1 && ak === aj) continue; // would swap with the agent pushing us
      if (ak !== -1 && next[ak] === here) continue; // would swap with an already-placed agent
      occNext[u] = ai;
      next[ai] = u;
      if (ak !== -1 && ak !== ai && next[ak] === -1 && !pibt(from, ak, ai)) continue;
      return true;
    }
    // Nowhere to go: stay put. The cell may be tentatively claimed by the
    // agent that pushed us (it will try elsewhere); a constrained agent's
    // claim is final, so then this configuration fails.
    next[ai] = -1;
    const holder = occNext[here];
    if (holder !== -1 && holder !== ai && holder !== aj) return false;
    occNext[here] = ai;
    next[ai] = here;
    return false;
  }

  function generate(node: HighNode, c: Constraint): number[] | null {
    const from = node.config;
    next.fill(-1);
    occNow.fill(-1);
    occNext.fill(-1);
    from.forEach((v, i) => (occNow[v] = i));
    // Apply the constraint chain first.
    for (let k: Constraint | null = c; k && k.who !== -1; k = k.parent) {
      if (occNext[k.where] !== -1) return null;
      const other = occNow[k.where];
      if (other !== -1 && next[other] === from[k.who]) return null; // swap
      next[k.who] = k.where;
      occNext[k.where] = k.who;
    }
    for (const i of node.order) {
      if (next[i] === -1 && !pibt(from, i, -1) && next[i] === -1) return null;
    }
    // Validate: no vertex or swap conflicts survive.
    const seen = new Set<number>();
    for (let i = 0; i < n; i++) {
      if (next[i] === -1 || seen.has(next[i])) return null;
      seen.add(next[i]);
      const j = occNow[next[i]];
      if (j !== -1 && j !== i && next[j] === from[i]) return null;
    }
    return Array.from(next);
  }

  const open: HighNode[] = [];
  const explored = new Map<string, HighNode>();
  const root = makeNode(p.starts.slice(), null);
  open.push(root);
  explored.set(key(root.config), root);

  while (open.length) {
    if (stats.configs > budget.nodes || performance.now() > budget.deadline) return null;
    const node = open[open.length - 1];
    if (isGoal(node.config)) {
      const plan: number[][] = [];
      for (let k: HighNode | null = node; k; k = k.parent) plan.push(k.config);
      return plan.reverse();
    }
    if (node.head >= node.tree.length) {
      open.pop();
      continue;
    }
    const c = node.tree[node.head++];
    stats.constraints++;
    if (c.depth < n) {
      const i = node.order[c.depth];
      const v = node.config[i];
      for (const u of shuffle([v, ...nbrs[v]])) node.tree.push({ parent: c, who: i, where: u, depth: c.depth + 1 });
    }
    // Free memory once a constraint tree has been consumed past its head.
    if (node.head > 256) {
      node.tree = node.tree.slice(node.head);
      node.head = 0;
    }
    const cfg = generate(node, c);
    if (!cfg) continue;
    const k = key(cfg);
    if (explored.has(k)) continue;
    const child = makeNode(cfg, node);
    explored.set(k, child);
    open.push(child);
  }
  return null;
}

/**
 * Solve with a few differently-seeded LaCAM runs inside a time budget and keep
 * the cheapest plan (by sum of costs). LaCAM itself is complete but not optimal.
 */
export function solve(p: Problem, { runs = 6, timeMs = 600, nodes = 60000 } = {}): SolveResult {
  const t0 = performance.now();
  const stats: SolveStats = { configs: 0, constraints: 0, ms: 0 };
  const dist = p.goals.map((g) => distanceField(p, g));
  for (let i = 0; i < p.starts.length; i++) {
    if (dist[i][p.starts[i]] === Infinity) {
      stats.ms = performance.now() - t0;
      return { ok: false, reason: 'unreachable', agent: i, stats };
    }
  }
  let best: { plan: number[][]; makespan: number; sumOfCosts: number } | null = null;
  const deadline = t0 + timeMs;
  for (let r = 0; r < runs; r++) {
    const runStats: SolveStats = { configs: 0, constraints: 0, ms: 0 };
    const plan = solveOnce(p, dist, 0x5eed + r * 7919, { nodes, deadline: r === 0 ? t0 + timeMs * 4 : deadline }, runStats);
    // Report the search effort of the first run: that is "the" LaCAM search.
    if (r === 0) {
      stats.configs = runStats.configs;
      stats.constraints = runStats.constraints;
    }
    if (plan) {
      const costs = planCosts(plan, p.goals);
      if (!best || costs.sumOfCosts < best.sumOfCosts || (costs.sumOfCosts === best.sumOfCosts && costs.makespan < best.makespan)) {
        best = { plan, ...costs };
      }
    } else if (r === 0) {
      break;
    }
    if (performance.now() > deadline) break;
  }
  stats.ms = performance.now() - t0;
  if (!best) return { ok: false, reason: 'limit', stats };
  // Trim trailing timesteps where everyone is already parked.
  best.plan = best.plan.slice(0, best.makespan + 1);
  return { ok: true, ...best, stats };
}
