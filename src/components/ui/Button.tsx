import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 min-h-touch min-w-touch px-6 rounded-pill ' +
  'font-display text-[15px] font-bold uppercase tracking-[0.08em] ' +
  'transition-[transform,filter] duration-(--duration-fast) ease-out ' +
  'enabled:active:translate-y-px enabled:active:brightness-110 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ' +
  'disabled:cursor-not-allowed disabled:bg-none disabled:bg-surface-raised disabled:text-text-faint ' +
  'disabled:border disabled:border-line disabled:shadow-none aria-busy:cursor-progress';

// Magenta is for the main action only: the gradient lives on primary and nowhere else
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-primary text-on-accent shadow-accent',
  secondary: 'bg-surface text-text border border-line-strong',
  ghost: 'px-3 bg-transparent text-text underline decoration-line-strong underline-offset-4',
  danger: 'bg-danger text-on-danger',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  type = 'button',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        BASE,
        VARIANTS[variant],
        size === 'lg' && 'min-h-control-lg text-base',
        block && 'flex w-full',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <span aria-hidden="true" className="size-[18px] rounded-pill border-2 border-current border-r-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}
