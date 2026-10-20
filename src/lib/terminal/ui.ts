/**
 * DOM side of the terminal. Loaded on first open by the listener in Terminal.astro.
 */
import { complete, run, type Effect, type Line, type Theme, type Tone } from './shell';
import type { TerminalData } from './types';

const HISTORY_KEY = 'terminal:history';
const HISTORY_MAX = 100;

const toneClass: Record<Tone, string> = {
  muted: 'text-on-surface-variant',
  accent: 'text-primary',
  error: 'text-error',
  strong: 'font-semibold text-on-surface',
};

type Elements = {
  dialog: HTMLDialogElement;
  log: HTMLElement;
  scroll: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  prompt: HTMLElement;
  close: HTMLButtonElement;
};

let els: Elements | undefined;
let data: TerminalData;
let history: string[] = [];
/** Position while walking history with ↑/↓; equals history.length when on a fresh line. */
let cursor = 0;
let draft = '';
let returnFocus: HTMLElement | null = null;
let greeted = false;

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]');
    if (Array.isArray(saved)) history = saved.filter((h): h is string => typeof h === 'string');
  } catch {
    history = [];
  }
}

function saveHistory() {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_MAX)));
  } catch {
    /* storage unavailable: history just won't survive navigation */
  }
}

const currentTheme = (): Theme => {
  const pinned = document.documentElement.dataset.theme;
  return pinned === 'light' || pinned === 'dark' ? pinned : 'system';
};

/** Same mechanism as ThemeToggle: data-theme on <html>, remembered in localStorage. */
function setTheme(value: Theme) {
  const root = document.documentElement;
  try {
    if (value === 'system') {
      delete root.dataset.theme;
      localStorage.removeItem('theme');
    } else {
      root.dataset.theme = value;
      localStorage.setItem('theme', value);
    }
  } catch {
    /* private mode: the choice just won't persist */
  }
}

function promptText() {
  const path = location.pathname.replace(/\/+$/, '');
  return `guest@${data.host}:~${path}$`;
}

function renderLine(parts: Line) {
  const row = document.createElement('div');
  if (parts.length === 0) row.textContent = ' ';
  for (const part of parts) {
    if (!part.text) continue;
    let node: HTMLElement;
    if (part.href) {
      const a = document.createElement('a');
      a.href = part.href;
      if (/^https?:/.test(part.href)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      a.className = 'underline decoration-outline-variant underline-offset-4 hover:decoration-primary';
      node = a;
    } else {
      node = document.createElement('span');
    }
    if (part.tone) node.className = `${node.className} ${toneClass[part.tone]}`.trim();
    if (part.nowrap) node.classList.add('whitespace-nowrap');
    node.textContent = part.text;
    row.append(node);
  }
  return row;
}

function print(lines: Line[]) {
  if (!els || lines.length === 0) return;
  const block = document.createElement('div');
  block.className = 'pb-2';
  block.append(...lines.map(renderLine));
  els.log.append(block);
}

function echo(command: string) {
  if (!els) return;
  // The echoed command is visual context; screen readers already know what they typed.
  const row = document.createElement('div');
  row.setAttribute('aria-hidden', 'true');
  const prompt = document.createElement('span');
  prompt.className = 'text-primary';
  prompt.textContent = `${promptText()} `;
  row.append(prompt, command);
  els.log.append(row);
}

function scrollToEnd() {
  els?.scroll.scrollTo({ top: els.scroll.scrollHeight });
}

function perform(effect: Effect | undefined) {
  if (!effect || !els) return;
  switch (effect.type) {
    case 'clear':
      els.log.replaceChildren();
      break;
    case 'exit':
      els.dialog.close();
      break;
    case 'theme':
      setTheme(effect.value);
      break;
    case 'navigate':
      if (effect.external) {
        window.open(effect.href, '_blank', 'noopener,noreferrer');
      } else {
        print([[{ text: `→ ${effect.href}`, tone: 'muted' }]]);
        els.dialog.close();
        location.assign(effect.href);
      }
      break;
  }
}

function submit(value: string) {
  echo(value);
  const command = value.trim();
  if (command && history[history.length - 1] !== command) {
    history.push(command);
    saveHistory();
  }
  cursor = history.length;
  draft = '';
  const result = run(command, { data, pathname: location.pathname, theme: currentTheme(), history });
  print(result.lines);
  perform(result.effect);
  scrollToEnd();
}

function walkHistory(step: -1 | 1) {
  if (!els || history.length === 0) return;
  if (cursor === history.length) draft = els.input.value;
  cursor = Math.max(0, Math.min(history.length, cursor + step));
  els.input.value = cursor === history.length ? draft : history[cursor];
  const end = els.input.value.length;
  requestAnimationFrame(() => els?.input.setSelectionRange(end, end));
}

function onInputKey(e: KeyboardEvent) {
  if (!els) return;
  const input = els.input;
  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const { value, candidates } = complete(input.value, {
      data,
      pathname: location.pathname,
      theme: currentTheme(),
      history,
    });
    input.value = value;
    if (candidates.length) {
      echo(input.value);
      print([candidates.flatMap((c, i) => [...(i ? [{ text: '  ' }] : []), { text: c, tone: 'muted' as const, nowrap: true }])]);
      scrollToEnd();
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    walkHistory(-1);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    walkHistory(1);
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    els.log.replaceChildren();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
    if (input.selectionStart !== input.selectionEnd) return; // let copy work
    e.preventDefault();
    echo(`${input.value}^C`);
    input.value = '';
    cursor = history.length;
    scrollToEnd();
  }
}

/** Keep Tab inside the dialog: Shift+Tab off the first control wraps to the input. */
function trapFocus(e: KeyboardEvent) {
  if (!els || e.key !== 'Tab' || e.target === els.input) return;
  const focusable = [...els.dialog.querySelectorAll<HTMLElement>('button, a[href], input')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function init(): Elements | undefined {
  const dialog = document.getElementById('terminal') as HTMLDialogElement | null;
  const source = document.getElementById('terminal-data');
  if (!dialog || !source?.textContent) return undefined;
  data = JSON.parse(source.textContent) as TerminalData;
  loadHistory();
  cursor = history.length;

  const q = <T extends Element>(sel: string) => dialog.querySelector(sel) as T;
  const found: Elements = {
    dialog,
    log: q('[data-terminal-log]'),
    scroll: q('[data-terminal-scroll]'),
    form: q('[data-terminal-form]'),
    input: q('#terminal-input'),
    prompt: q('[data-terminal-prompt]'),
    close: q('[data-terminal-close]'),
  };
  q<HTMLElement>('[data-terminal-host]').textContent = `guest@${data.host}`;

  found.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = found.input.value;
    found.input.value = '';
    submit(value);
  });
  found.input.addEventListener('keydown', onInputKey);
  dialog.addEventListener('keydown', trapFocus);
  found.close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    returnFocus?.focus();
    returnFocus = null;
  });
  // Clicks on the backdrop close; clicks in the output (that aren't a selection or link) refocus the prompt.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
      return;
    }
    if (!(e.target as HTMLElement).closest('a, button') && !window.getSelection()?.toString()) {
      found.input.focus();
    }
  });
  return found;
}

export function openTerminal() {
  els ??= init();
  if (!els || els.dialog.open) return;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  els.prompt.textContent = promptText();
  els.dialog.showModal();
  els.input.focus();
  if (!greeted) {
    greeted = true;
    print([
      [
        { text: `${data.site.name} `, tone: 'strong' },
        { text: `— ${data.host}`, tone: 'muted' },
      ],
      [
        { text: 'Type ', tone: 'muted' },
        { text: 'help', tone: 'accent' },
        { text: ' to see what this shell can do, or ', tone: 'muted' },
        { text: 'ls', tone: 'accent' },
        { text: ' to look around.', tone: 'muted' },
      ],
    ]);
  }
  scrollToEnd();
}
