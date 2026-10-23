import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Says why the app needs a permission, or how to give it back, before or after the browser asks. */
export function PermissionPrompt({ Icon, title, text, children }: { Icon: LucideIcon; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-6 pb-4 rounded-card bg-surface text-text border border-line-strong text-left">
      <Icon className="size-8 text-text" aria-hidden="true" />
      <h2 className="font-display text-heading font-semibold">{title}</h2>
      <p className="text-text-muted">{text}</p>
      {children}
    </div>
  );
}
