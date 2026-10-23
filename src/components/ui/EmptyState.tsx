import { ClipboardList, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  text?: string;
  Icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

/** Says why there is nothing here, with at most one useful action. */
export function EmptyState({ title, text, Icon = ClipboardList, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 px-4 py-12">
      <Icon className="size-10 text-text-muted" aria-hidden="true" />
      <h2 className="font-display text-heading font-semibold text-text">{title}</h2>
      {text && <p className="max-w-[32ch] text-text-muted">{text}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
