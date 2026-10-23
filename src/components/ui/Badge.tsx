import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'neutral' | 'points' | 'done' | 'failed';

const VARIANTS: Record<Variant, string> = {
  neutral: 'bg-surface-raised text-text-muted border-line-strong font-display uppercase tracking-[0.08em] text-label',
  // Points are the only volt on screen
  points: 'bg-attention text-on-attention border-attention font-mono font-bold text-sm',
  done: 'bg-progress text-on-progress border-progress font-display uppercase tracking-[0.08em] text-label',
  failed: 'bg-danger-soft text-danger-text border-danger font-display uppercase tracking-[0.08em] text-label',
};

export function Badge({ variant = 'neutral', Icon, children }: { variant?: Variant; Icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 h-7 px-3 rounded-pill border font-semibold whitespace-nowrap ${VARIANTS[variant]}`}>
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </span>
  );
}
