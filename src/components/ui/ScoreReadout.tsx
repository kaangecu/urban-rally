// Team score in the header. Points are the only volt on screen.
export function ScoreReadout({ score }: { score: number }) {
  return (
    <div className="inline-flex flex-col items-end gap-0.5 px-3 py-2 rounded-control bg-attention-soft border border-attention">
      <span className="font-mono text-2xl/7 font-bold tabular-nums text-attention-text">{score.toLocaleString('en-US')}</span>
      <span className="font-display text-label font-semibold uppercase text-text-muted">pts</span>
    </div>
  );
}
