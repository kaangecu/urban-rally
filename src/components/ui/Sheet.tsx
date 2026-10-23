import { useEffect, useId, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Glass bottom sheet: modal dialog that traps focus and hands it back to the trigger on close
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => trigger?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div data-testid="sheet-backdrop" aria-hidden="true" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="ur-glass animate-sheet-in relative flex flex-col gap-4 max-h-[90vh] w-full max-w-2xl mx-auto px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom,0px))] rounded-t-sheet text-text shadow-sheet"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-title font-bold text-balance">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid place-items-center size-touch shrink-0 rounded-pill text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto text-text-muted">{children}</div>
        {footer && <div className="flex flex-col gap-2">{footer}</div>}
      </div>
    </div>
  );
}
