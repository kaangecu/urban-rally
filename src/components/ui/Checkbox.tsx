import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ label, error, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="flex items-start gap-3 min-h-touch text-sm text-text-muted cursor-pointer">
        <span className="relative grid place-items-center shrink-0">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={[
              'peer appearance-none size-6 m-0 rounded-sm border-2 border-line-strong bg-surface-raised cursor-pointer',
              'checked:bg-accent checked:border-accent aria-invalid:border-danger',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            ].join(' ')}
            {...props}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="pointer-events-none absolute size-4 text-on-accent opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="pt-0.5">{label}</span>
      </label>
      {error && (
        <p id={errorId} className="text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
