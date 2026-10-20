/** Word count and ~230 wpm reading time, ignoring code fences so a long listing doesn't inflate it. */
export function readingStats(body: string | undefined) {
  const words = (body ?? '').replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 230)) };
}
