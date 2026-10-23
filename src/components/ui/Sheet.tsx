import { useEffect, useId, useRef, type ReactNode } from 'react';
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

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    // Lock the page behind the sheet
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // On document, not the panel, so Escape and the trap still work when focus has left the panel
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.contains(document.activeElement);
      if (!inside || (e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div data-testid="sheet-backdrop" aria-hidden="true" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="ur-glass animate-sheet-in relative flex flex-col gap-4 max-h-[90vh] w-full max-w-2xl mx-auto px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom,0px))] rounded-t-sheet text-text shadow-sheet outline-none"
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
        <div className="overflow-y-auto overscroll-contain text-text-muted">{children}</div>
        {footer && <div className="flex flex-col gap-2">{footer}</div>}
      </div>
    </div>
  );
}
