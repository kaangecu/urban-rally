import type { LucideIcon } from 'lucide-react';

export function TaskTypeTag({ label, Icon, sponsored = false }: { label: string; Icon: LucideIcon; sponsored?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 min-h-8 pl-2 pr-3 rounded-pill border bg-surface text-text',
        'font-display text-label font-semibold uppercase',
        sponsored ? 'border-attention' : 'border-line-strong',
      ].join(' ')}
    >
      <Icon className={`size-[18px] ${sponsored ? 'text-attention-text' : 'text-text'}`} aria-hidden="true" />
      {label}
    </span>
  );
}
