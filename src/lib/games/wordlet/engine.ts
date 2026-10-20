/**
 * Daily Wordlet: the rules of the Flutter game in public/wordlet, made daily.
 *
 * - Five-letter answers drawn from Wordlet's own word pool (./words.ts).
 * - Six guesses. Any five letters are accepted, exactly as in the original:
 *   Wordlet never checked guesses against a dictionary.
 * - Repeated letters are scored the usual way: exact matches first, then
 *   "present" only while the answer still has unmatched copies of that letter.
 *
 * Everything here is pure so it can be reasoned about (and tested) without a DOM.
 */

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type Hint = 'correct' | 'present' | 'absent';

/** Day 0 of the daily puzzle. Puzzle numbers count from 1 on this date. */
const EPOCH_UTC = Date.UTC(2026, 9, 19);
const DAY_MS = 86_400_000;

/** Days since the epoch on the player's own calendar, so the word turns over at their midnight. */
export function dayNumber(now: Date = new Date()): number {
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((local - EPOCH_UTC) / DAY_MS);
}

/** Small deterministic PRNG (mulberry32). Same seed, same sequence, in every browser. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHUFFLE_SEED = 0x57_4f_52_44; // "WORD"
let order: number[] | null = null;
let orderFor: readonly string[] | null = null;

/**
 * The answer for a given day. The pool is shuffled once with a fixed seed and
 * then walked in order, so no word repeats until the whole pool has been used.
 */
export function answerFor(day: number, answers: readonly string[]): string {
  if (order === null || orderFor !== answers) {
    const rand = mulberry32(SHUFFLE_SEED);
    order = answers.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    orderFor = answers;
  }
  const n = order.length;
  return answers[order[((day % n) + n) % n]];
}

/** Score a guess against the answer. Both must be WORD_LENGTH uppercase letters. */
export function score(guess: string, answer: string): Hint[] {
  const hints: Hint[] = Array(WORD_LENGTH).fill('absent');
  const unmatched = new Map<string, number>();
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) hints[i] = 'correct';
    else unmatched.set(answer[i], (unmatched.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (hints[i] === 'correct') continue;
    const left = unmatched.get(guess[i]) ?? 0;
    if (left > 0) {
      hints[i] = 'present';
      unmatched.set(guess[i], left - 1);
    }
  }
  return hints;
}

const RANK: Record<Hint, number> = { absent: 0, present: 1, correct: 2 };

/** Best hint seen so far for each letter, for colouring the keyboard. */
export function keyHints(guesses: readonly string[], answer: string): Map<string, Hint> {
  const keys = new Map<string, Hint>();
  for (const guess of guesses) {
    score(guess, answer).forEach((hint, i) => {
      const prev = keys.get(guess[i]);
      if (!prev || RANK[hint] > RANK[prev]) keys.set(guess[i], hint);
    });
  }
  return keys;
}

export type Status = 'playing' | 'won' | 'lost';

export function statusOf(guesses: readonly string[], answer: string): Status {
  if (guesses.includes(answer)) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

/* ---------------------------------------------------------------------------
   Persistence
--------------------------------------------------------------------------- */

export interface Stats {
  played: number;
  wins: number;
  streak: number;
  maxStreak: number;
  /** Day number of the last win, for working out whether the streak is still alive. */
  lastWinDay: number | null;
  /** Wins by guess count: index 0 is "solved in one". */
  distribution: number[];
}

export interface Saved {
  version: 1;
  /** The day the in-progress board belongs to. */
  day: number;
  guesses: string[];
  /** The last day already counted in the stats, so a reload never counts a game twice. */
  recordedDay: number | null;
  stats: Stats;
}

export const STORAGE_KEY = 'wordlet:daily';

const emptyStats = (): Stats => ({
  played: 0,
  wins: 0,
  streak: 0,
  maxStreak: 0,
  lastWinDay: null,
  distribution: Array(MAX_GUESSES).fill(0),
});

const isInt = (v: unknown): v is number => Number.isInteger(v);
const isWord = (v: unknown): v is string => typeof v === 'string' && /^[A-Z]{5}$/.test(v);

/** Parse whatever is in storage; anything malformed falls back to a fresh record. */
export function parseSaved(raw: string | null, today: number): Saved {
  const fresh: Saved = { version: 1, day: today, guesses: [], recordedDay: null, stats: emptyStats() };
  if (!raw) return fresh;
  let data: Partial<Saved>;
  try {
    data = JSON.parse(raw);
  } catch {
    return fresh;
  }
  const s = data?.stats as Partial<Stats> | undefined;
  const stats: Stats =
    s &&
    isInt(s.played) &&
    isInt(s.wins) &&
    isInt(s.streak) &&
    isInt(s.maxStreak) &&
    (s.lastWinDay === null || isInt(s.lastWinDay)) &&
    Array.isArray(s.distribution) &&
    s.distribution.length === MAX_GUESSES &&
    s.distribution.every(isInt)
      ? (s as Stats)
      : emptyStats();
  const sameDay = data.day === today && Array.isArray(data.guesses) && data.guesses.every(isWord);
  return {
    version: 1,
    day: today,
    guesses: sameDay ? data.guesses!.slice(0, MAX_GUESSES) : [],
    recordedDay: isInt(data.recordedDay) ? data.recordedDay : null,
    stats,
  };
}

/** The streak as it stands today: it lapses if yesterday's puzzle wasn't solved. */
export function liveStreak(stats: Stats, today: number): number {
  if (stats.lastWinDay === null) return 0;
  return today - stats.lastWinDay <= 1 ? stats.streak : 0;
}

/** Fold a finished game into the stats. */
export function record(stats: Stats, day: number, status: Exclude<Status, 'playing'>, guessCount: number): Stats {
  const next: Stats = { ...stats, distribution: stats.distribution.slice() };
  next.played += 1;
  if (status === 'won') {
    next.wins += 1;
    next.streak = stats.lastWinDay === day - 1 ? stats.streak + 1 : 1;
    next.maxStreak = Math.max(next.maxStreak, next.streak);
    next.lastWinDay = day;
    next.distribution[guessCount - 1] += 1;
  } else {
    next.streak = 0;
  }
  return next;
}

/* ---------------------------------------------------------------------------
   Sharing
--------------------------------------------------------------------------- */

// Tiles on the site are amber (correct) and sky (present), so the grid matches the board.
const EMOJI: Record<Hint, string> = { correct: '\u{1F7E7}', present: '\u{1F7E6}', absent: '⬜' };

export const SHARE_URL = 'https://davidmgray.com/play/wordlet';

export function shareText(day: number, guesses: readonly string[], answer: string): string {
  const won = guesses.includes(answer);
  const grid = guesses.map((g) => score(g, answer).map((h) => EMOJI[h]).join('')).join('\n');
  return `Wordlet #${day + 1} ${won ? guesses.length : 'X'}/${MAX_GUESSES}\n\n${grid}\n\n${SHARE_URL}`;
}
