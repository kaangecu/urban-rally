import { useId, type InputHTMLAttributes } from 'react';
import { CircleAlert } from 'lucide-react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Large centred monospace style for the team code */
  code?: boolean;
}

export function TextField({ label, hint, error, code = false, id, className, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="font-display text-label font-semibold uppercase text-text-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={[
          'w-full px-4 rounded-control bg-surface-raised border border-line-strong text-text',
          'placeholder:text-text-faint focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-focus-ring focus-visible:border-focus-ring',
          'aria-invalid:border-2 aria-invalid:border-danger',
          'disabled:bg-surface disabled:border-line disabled:text-text-faint',
          code
            ? 'min-h-control-lg text-center uppercase font-mono text-[28px] leading-none font-bold tracking-[0.24em]'
            : 'min-h-touch text-body',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      />
      {error && (
        <p id={errorId} className="flex items-start gap-2 text-sm text-danger-text">
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
