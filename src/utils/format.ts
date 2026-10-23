/**
 * Display formatting shared across screens.
 * Points are always "pts" (never XP or Points).
 */

export function formatPoints(points: number, { signed = false }: { signed?: boolean } = {}): string {
  const value = points.toLocaleString('en-US');
  return `${signed && points >= 0 ? '+' : ''}${value} pts`;
}

export function formatTaskCount(count: number): string {
  return `${count} ${count === 1 ? 'task' : 'tasks'} done`;
}

/** Recording clock, e.g. "00:12". */
export function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
