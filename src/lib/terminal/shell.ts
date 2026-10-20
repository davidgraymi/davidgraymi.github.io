/**
 * The terminal's command interpreter. Pure: it takes a line of input and returns
 * output lines plus an optional side effect for the UI to perform. No DOM here.
 */
import type { TerminalData, TerminalEntry } from './types';

export type Tone = 'muted' | 'accent' | 'error' | 'strong';
export type Part = { text: string; tone?: Tone; href?: string; nowrap?: boolean };
export type Line = Part[];

export type Theme = 'light' | 'dark' | 'system';
export type Effect =
  | { type: 'navigate'; href: string; external?: boolean }
  | { type: 'theme'; value: Theme }
  | { type: 'clear' }
  | { type: 'exit' };

export type Result = { lines: Line[]; effect?: Effect };

export type Context = {
  data: TerminalData;
  /** Current page path, for `pwd` and relative `cd ..`. */
  pathname: string;
  theme: Theme;
  history: string[];
};

const t = (text: string, tone?: Tone): Part => ({ text, tone });
const line = (...parts: (Part | string)[]): Line => parts.map((p) => (typeof p === 'string' ? t(p) : p));
const err = (text: string): Result => ({ lines: [line(t(text, 'error'))] });

type Command = {
  usage: string;
  help: string;
  /** Candidates for the first argument, used by tab completion. */
  args?: (ctx: Context) => string[];
  run: (args: string[], ctx: Context) => Result;
  hidden?: boolean;
};

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));

/** Every place `cd` and `open` can go: sections, entries (bare or dir/slug), socials. */
function destinations(data: TerminalData) {
  const map = new Map<string, { href: string; external?: boolean }>();
  map.set('home', { href: '/' });
  for (const s of data.sections) map.set(s.name, { href: s.href });
  for (const [dir, entries] of Object.entries(data.dirs)) {
    for (const e of entries) {
      map.set(`${dir}/${e.slug}`, { href: e.href });
      if (!map.has(e.slug)) map.set(e.slug, { href: e.href });
    }
  }
  for (const s of data.socials) map.set(s.name, { href: s.href, external: true });
  return map;
}

/**
 * Parent of a page path. Repeated slashes are collapsed first: on a URL like
 * `//evil.com/x` a naive split would yield `//evil.com`, a protocol-relative
 * (off-site) URL. The result always starts with exactly one slash.
 */
export function parentPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  return `/${segments.slice(0, -1).join('/')}`;
}

/**
 * Resolve a navigation target and return it only if it stays on this origin.
 * Rejects protocol-relative hrefs (`//host`) outright.
 */
export function safeInternalHref(href: string, origin: string): string | undefined {
  if (/^\/\//.test(href) || /^[\\/][\\/]/.test(href)) return undefined;
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return undefined;
    return url.pathname.replace(/\/{2,}/g, '/') + url.search + url.hash;
  } catch {
    return undefined;
  }
}

const normalise = (arg: string) => arg.replace(/^~?\/+/, '').replace(/\/+$/, '');

function findEntry(data: TerminalData, arg: string): TerminalEntry | undefined {
  const key = normalise(arg);
  const [dir, slug] = key.includes('/') ? key.split('/', 2) : [undefined, key];
  const pools = dir ? [data.dirs[dir] ?? []] : Object.values(data.dirs);
  for (const pool of pools) {
    const hit = pool.find((e) => e.slug === slug);
    if (hit) return hit;
  }
  return undefined;
}

function listDir(data: TerminalData, dir: string): Result {
  const entries = data.dirs[dir];
  if (!entries) {
    return data.sections.some((s) => s.name === dir)
      ? { lines: [line(t(`${dir}: a page, not a directory. Try `, 'muted'), t(`cd ${dir}`, 'accent'))] }
      : err(`ls: cannot access '${dir}': No such file or directory`);
  }
  if (entries.length === 0) return { lines: [line(t('(empty)', 'muted'))] };
  const width = Math.min(34, Math.max(...entries.map((e) => e.slug.length)) + 2);
  return {
    lines: entries.map((e) => [
      { text: e.slug, tone: 'accent', href: e.href },
      t(pad('', width - e.slug.length)),
      t(e.meta ? `${e.meta}  ` : '', 'muted'),
      t(e.title),
    ]),
  };
}

const sudoLines = [
  'guest is not in the sudoers file. This incident will be reported.',
  'Nice try. Root access is reserved for people who wrote the threat model.',
  'Permission denied. (This site has a CSP, too.)',
];

export const commands: Record<string, Command> = {
  help: {
    usage: 'help',
    help: 'list commands',
    run: () => {
      const visible = Object.values(commands).filter((c) => !c.hidden);
      const width = Math.max(...visible.map((c) => c.usage.length)) + 3;
      return {
        lines: [
          ...visible.map((c) => line(t(pad(c.usage, width), 'accent'), t(c.help, 'muted'))),
          [],
          line(t('Tab completes, ↑/↓ walks history, Esc closes.', 'muted')),
        ],
      };
    },
  },
  ls: {
    usage: 'ls [work|blog|photos]',
    help: 'list a section, or everything at the top level',
    args: (ctx) => Object.keys(ctx.data.dirs),
    run: (args, ctx) => {
      if (args[0]) return listDir(ctx.data, normalise(args[0]));
      const dirs = Object.keys(ctx.data.dirs);
      const pages = ctx.data.sections.filter((s) => !dirs.includes(s.name));
      return {
        lines: [
          line(
            ...dirs.flatMap((d) => [{ text: `${d}/`, tone: 'accent' as Tone, href: `/${d}` }, t('  ')]),
            ...pages.flatMap((p) => [{ text: p.name, href: p.href }, t('  ')]),
            t('about.txt', 'muted'),
          ),
        ],
      };
    },
  },
  cd: {
    usage: 'cd <section>',
    help: 'go to a section (cd work, cd blog, cd ~)',
    args: (ctx) => [...ctx.data.sections.map((s) => s.name), '~', '..'],
    run: (args, ctx) => {
      const arg = args[0] ?? '~';
      if (arg === '~' || arg === '/' || arg === 'home') return { lines: [], effect: { type: 'navigate', href: '/' } };
      if (arg === '..') {
        return { lines: [], effect: { type: 'navigate', href: parentPath(ctx.pathname) } };
      }
      const dest = destinations(ctx.data).get(normalise(arg));
      if (!dest || dest.external) return err(`cd: no such file or directory: ${arg}`);
      return { lines: [], effect: { type: 'navigate', href: dest.href } };
    },
  },
  open: {
    usage: 'open <slug>',
    help: 'open a project, post, section or profile',
    args: (ctx) => [...destinations(ctx.data).keys()].filter((k) => !k.includes('/')),
    run: (args, ctx) => {
      if (!args[0]) return err('usage: open <slug>   (try: ls work)');
      const dest = destinations(ctx.data).get(normalise(args[0]));
      if (!dest) return err(`open: ${args[0]}: not found. Try ls work or ls blog.`);
      return {
        lines: dest.external ? [line(t(`opening ${dest.href} in a new tab`, 'muted'))] : [],
        effect: { type: 'navigate', href: dest.href, external: dest.external },
      };
    },
  },
  cat: {
    usage: 'cat about',
    help: 'print the short bio (or cat <slug> for a summary)',
    args: (ctx) => ['about', 'contact', ...Object.values(ctx.data.dirs).flatMap((d) => d.map((e) => e.slug))],
    run: (args, ctx) => {
      const { site, socials } = ctx.data;
      const arg = normalise(args[0] ?? '');
      if (!arg) return err('usage: cat <file>   (try: cat about)');
      if (arg === 'about' || arg === 'about.txt') {
        return {
          lines: [
            line(t(site.name, 'strong')),
            line(t(site.role, 'muted')),
            line(t(site.location, 'muted')),
            [],
            line(site.tagline),
            ...(site.availability ? [[], line(t('● ', 'accent'), site.availability)] : []),
          ],
        };
      }
      if (arg === 'contact') {
        return {
          lines: [
            line(t(pad('email', 10), 'muted'), { text: site.email, href: `mailto:${site.email}` }),
            ...socials.map((s) => line(t(pad(s.name, 10), 'muted'), { text: s.href, href: s.href })),
          ],
        };
      }
      const entry = findEntry(ctx.data, arg);
      if (!entry) return err(`cat: ${args[0]}: No such file or directory`);
      return {
        lines: [
          line(t(entry.title, 'strong'), t(entry.meta ? `  ${entry.meta}` : '', 'muted')),
          line(entry.summary),
          line({ text: entry.href, tone: 'accent', href: entry.href }),
        ],
      };
    },
  },
  whoami: {
    usage: 'whoami',
    help: 'who is at the keyboard',
    run: (_args, ctx) => ({
      lines: [
        line(t('guest', 'strong'), t(` — a visitor on ${ctx.data.host}.`, 'muted')),
        line(t(`The person who lives here is ${ctx.data.site.name}. Try `, 'muted'), t('cat about', 'accent')),
      ],
    }),
  },
  theme: {
    usage: 'theme light|dark|system',
    help: 'switch the colour theme',
    args: () => ['light', 'dark', 'system'],
    run: (args, ctx) => {
      const value = args[0];
      if (!value) return { lines: [line(t('theme: ', 'muted'), t(ctx.theme, 'accent'))] };
      if (value !== 'light' && value !== 'dark' && value !== 'system') {
        return err(`theme: unknown theme '${value}'. Use light, dark or system.`);
      }
      return { lines: [line(t(`theme set to ${value}`, 'muted'))], effect: { type: 'theme', value } };
    },
  },
  play: {
    usage: 'play [game]',
    help: 'list the games on this site, or launch one',
    args: (ctx) => ctx.data.games.map((g) => g.name),
    run: (args, ctx) => {
      const { games } = ctx.data;
      if (!args[0]) {
        if (games.length === 0) return { lines: [line(t('No games installed. Yet.', 'muted'))] };
        const width = Math.max(...games.map((g) => g.name.length)) + 3;
        return {
          lines: games.map((g) => [
            { text: g.name, tone: 'accent', href: g.href },
            t(pad('', width - g.name.length)),
            t(g.summary, 'muted'),
          ]),
        };
      }
      const game = games.find((g) => g.name === args[0].toLowerCase());
      if (!game) {
        const hint = games.length ? ` Installed: ${games.map((g) => g.name).join(', ')}.` : '';
        return err(`play: ${args[0]}: game not found.${hint}`);
      }
      return { lines: [], effect: { type: 'navigate', href: game.href } };
    },
  },
  sudo: {
    usage: 'sudo <command>',
    help: 'try it',
    run: (args) => {
      if (!args.length) return err('usage: sudo <command>');
      const pick = sudoLines[args.join(' ').length % sudoLines.length];
      return err(`[sudo] ${pick}`);
    },
  },
  history: {
    usage: 'history',
    help: 'show previous commands',
    run: (_args, ctx) => ({
      lines: ctx.history.map((h, i) => line(t(`${String(i + 1).padStart(4)}  `, 'muted'), h)),
    }),
  },
  pwd: {
    usage: 'pwd',
    help: 'print the current page',
    hidden: true,
    run: (_args, ctx) => ({ lines: [line(`~${ctx.pathname === '/' ? '' : ctx.pathname.replace(/\/+$/, '')}`)] }),
  },
  echo: {
    usage: 'echo <text>',
    help: 'print text',
    hidden: true,
    run: (args) => ({ lines: [line(args.join(' '))] }),
  },
  rm: {
    usage: 'rm',
    help: '',
    hidden: true,
    run: () => err('rm: this is a static site. There is nothing to delete, and you are not root.'),
  },
  vim: {
    usage: 'vim',
    help: '',
    hidden: true,
    run: () => ({ lines: [line(t('You are now trapped in vim. Just kidding: type ', 'muted'), t('exit', 'accent'))] }),
  },
  clear: {
    usage: 'clear',
    help: 'clear the screen',
    run: () => ({ lines: [], effect: { type: 'clear' } }),
  },
  exit: {
    usage: 'exit',
    help: 'close the terminal',
    run: () => ({ lines: [], effect: { type: 'exit' } }),
  },
};

const aliases: Record<string, string> = { '?': 'help', man: 'help', dir: 'ls', more: 'cat', less: 'cat', quit: 'exit', logout: 'exit', cls: 'clear', emacs: 'vim', nano: 'vim' };

const tokenize = (input: string) => input.trim().split(/\s+/).filter(Boolean);

export function run(input: string, ctx: Context): Result {
  const [name, ...args] = tokenize(input);
  if (!name) return { lines: [] };
  const cmd = commands[name.toLowerCase()] ?? commands[aliases[name.toLowerCase()] ?? ''];
  if (!cmd) {
    return { lines: [line(t(`command not found: ${name}. Type `, 'error'), t('help', 'accent'), t('.', 'error'))] };
  }
  return cmd.run(args, ctx);
}

const commonPrefix = (words: string[]) =>
  words.reduce((acc, w) => {
    let i = 0;
    while (i < acc.length && i < w.length && acc[i] === w[i]) i++;
    return acc.slice(0, i);
  });

/**
 * Bash-style completion: a single match completes (with a trailing space), several
 * matches extend to their common prefix and are returned as candidates to show.
 */
export function complete(input: string, ctx: Context): { value: string; candidates: string[] } {
  const endsWithSpace = /\s$/.test(input);
  const tokens = tokenize(input);
  const current = endsWithSpace ? '' : (tokens.pop() ?? '');
  const head = tokens;

  let pool: string[];
  if (head.length === 0) {
    pool = Object.entries(commands)
      .filter(([, c]) => !c.hidden)
      .map(([n]) => n);
  } else if (head.length === 1) {
    const cmd = commands[head[0].toLowerCase()];
    pool = cmd?.args?.(ctx) ?? [];
  } else {
    pool = [];
  }

  const matches = [...new Set(pool)].filter((p) => p.startsWith(current.toLowerCase())).sort();
  const prefix = head.length ? `${head.join(' ')} ` : '';
  if (matches.length === 0) return { value: input, candidates: [] };
  if (matches.length === 1) return { value: `${prefix}${matches[0]} `, candidates: [] };
  const common = commonPrefix(matches);
  return { value: `${prefix}${common.length > current.length ? common : current}`, candidates: matches };
}
