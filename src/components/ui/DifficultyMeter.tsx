/** Neutral pips: difficulty is not a status, so it gets no colour. */
export function DifficultyMeter({ level, max = 3 }: { level: number; max?: number }) {
  return (
    <span role="img" aria-label={`Difficulty ${level} of ${max}`} className="inline-flex items-center gap-[3px] h-7">
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          className={`size-2 rounded-pill border ${i < level ? 'bg-text border-text' : 'border-line-strong'}`}
        />
      ))}
    </span>
  );
}
