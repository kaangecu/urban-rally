import { CircleCheck, X } from 'lucide-react';

/**
 * Short confirmation, e.g. "Photo sent". Keep it mounted and pass null when idle:
 * screen readers often skip a live region that appears together with its text.
 */
export function Toast({ message, onDismiss }: { message: string | null; onDismiss?: () => void }) {
  return (
    <div role="status">
      {message && (
        <div className="flex items-center gap-3 min-h-touch py-2 pr-2 pl-4 rounded-control bg-surface-raised text-text border border-line-strong shadow-sheet">
          <CircleCheck className="size-6 shrink-0 text-progress-text" aria-hidden="true" />
          <span className="flex-1 min-w-0">{message}</span>
          {onDismiss && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={onDismiss}
              className="grid place-items-center size-touch shrink-0 rounded-control text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
