interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  /** Shown on the right, e.g. "1 / 3 tasks · 50 / 180 pts" */
  valueText?: string;
}

export function ProgressBar({ label, value, max, valueText }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-label font-semibold uppercase text-text-muted">{label}</span>
        {valueText && <span className="font-mono text-sm font-medium tabular-nums text-text">{valueText}</span>}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText}
        className="h-2.5 rounded-pill border border-line-strong bg-surface-raised overflow-hidden"
      >
        <div className="h-full rounded-pill bg-progress" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
