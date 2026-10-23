import type { ButtonHTMLAttributes, MouseEvent } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

const BASE =
  'relative inline-flex items-center justify-center gap-2 min-w-touch rounded-pill ' +
  'font-display font-bold uppercase tracking-[0.08em] ' +
  'transition-[transform,filter] duration-(--duration-fast) ease-out ' +
  'enabled:active:translate-y-px enabled:active:brightness-110 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ' +
  'disabled:cursor-not-allowed disabled:bg-none disabled:bg-surface-raised disabled:text-text-faint ' +
  'disabled:border disabled:border-line disabled:shadow-none aria-busy:cursor-progress';

// Magenta is for the main action only: the gradient lives on primary and nowhere else
const VARIANTS: Record<Variant, string> = {
  primary: 'px-6 bg-gradient-primary text-on-accent shadow-accent',
  secondary: 'px-6 bg-surface text-text border border-line-strong',
  ghost: 'px-3 bg-transparent text-text underline decoration-line-strong underline-offset-4',
  danger: 'px-6 bg-danger text-on-danger',
};

// One entry per size: Tailwind's output order, not class order, decides which of two clashing utilities wins
const SIZES: Record<Size, string> = {
  md: 'min-h-touch text-[15px]',
  lg: 'min-h-control-lg text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  type = 'button',
  className,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  // Loading keeps the button focusable (native disabled would drop focus to <body>) and just ignores clicks
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={[
        BASE,
        VARIANTS[variant],
        SIZES[size],
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
