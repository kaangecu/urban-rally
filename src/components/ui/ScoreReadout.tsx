import { useEffect, useRef, useState } from 'react';

const COUNT_UP_MS = 600;
const DELTA_MS = 3000;

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Team score in the header. Points are the only volt on screen.
export function ScoreReadout({ score }: { score: number }) {
  const [shown, setShown] = useState(score);
  const [delta, setDelta] = useState<number | null>(null);
  const previous = useRef(score);

  // When the score goes up, count up to it (unless reduced motion) and show the gain for a moment
  useEffect(() => {
    const from = previous.current;
    previous.current = score;
    if (score <= from) {
      setShown(score);
      return;
    }
    setDelta(score - from);
    const hideDelta = window.setTimeout(() => setDelta(null), DELTA_MS);

    if (prefersReducedMotion()) {
      setShown(score);
      return () => window.clearTimeout(hideDelta);
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      setShown(Math.round(from + (score - from) * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(hideDelta);
    };
  }, [score]);

  return (
    <div className="inline-flex flex-col items-end gap-0.5 px-3 py-2 rounded-control bg-attention-soft border border-attention">
      <span className="font-mono text-2xl/7 font-bold tabular-nums text-attention-text">
        {shown.toLocaleString('en-US')}
        {delta !== null && <span className="ml-2 text-sm text-progress-text">+{delta.toLocaleString('en-US')} pts</span>}
      </span>
      <span className="font-display text-label font-semibold uppercase text-text-muted">pts</span>
    </div>
  );
}
