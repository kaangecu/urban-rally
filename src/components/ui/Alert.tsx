import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Variant = 'info' | 'success' | 'warning' | 'danger';

const STYLES: Record<Variant, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: 'bg-surface-raised ring-line-strong', icon: 'text-text-muted', Icon: Info },
  success: { box: 'bg-progress-soft ring-progress', icon: 'text-progress-text', Icon: CircleCheck },
  // Amber is for problems the player can fix
  warning: { box: 'bg-warning-soft ring-warning', icon: 'text-warning-text', Icon: TriangleAlert },
  danger: { box: 'bg-danger-soft ring-danger', icon: 'text-danger-text', Icon: CircleAlert },
};

interface AlertProps {
  variant?: Variant;
  title: string;
  text?: ReactNode;
  children?: ReactNode;
}

export function Alert({ variant = 'info', title, text, children }: AlertProps) {
  const { box, icon, Icon } = STYLES[variant];
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={`flex items-start gap-3 px-4 py-3 rounded-control ring-1 ring-inset text-text ${box}`}
    >
      <Icon className={`size-6 shrink-0 ${icon}`} aria-hidden="true" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-bold">{title}</p>
        {text && <p className="text-sm text-text-muted">{text}</p>}
        {children}
      </div>
    </div>
  );
}
