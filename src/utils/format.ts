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
