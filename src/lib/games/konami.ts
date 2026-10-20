/**
 * CRT mode toggle for the Konami code easter egg, driven by KonamiCode.astro.
 * The toast's live region is created on first use, so pages pay nothing until then.
 */

const KEY = 'crt';
let toast: HTMLElement | null = null;
let hideTimer: number | undefined;

function getToast(): HTMLElement {
  if (toast) return toast;
  toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.dataset.hidden = '';
  toast.className = 'crt-toast'; // styled in KonamiCode.astro
  document.body.append(toast);
  return toast;
}

function announce(message: string) {
  const el = getToast();
  // Clear, then write on the next tick: a freshly inserted live region, or the
  // same message twice in a row, is still announced.
  el.textContent = '';
  window.clearTimeout(hideTimer);
  window.setTimeout(() => {
    el.textContent = message;
    delete el.dataset.hidden;
    hideTimer = window.setTimeout(() => {
      el.dataset.hidden = '';
    }, 2400);
  }, 60);
}

/** Turn CRT mode on or off; omit `on` to toggle. */
export function setCrt(on?: boolean) {
  const root = document.documentElement;
  const next = on ?? !root.classList.contains('crt');
  root.classList.toggle('crt', next);
  try {
    if (next) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the mode just won't persist */
  }
  announce(next ? 'CRT mode on' : 'CRT mode off');
}
