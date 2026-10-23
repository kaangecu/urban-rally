import { CircleAlert } from 'lucide-react';
import { Button } from './ui/Button';
import { MESSAGES } from '../utils/messages';

/** A short code organisers can ask for; the raw error only goes to the console. */
function getErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  return typeof code === 'string' && code ? code : 'boot/unknown';
}

export function BootError({ error, onReload = () => location.reload() }: { error: unknown; onReload?: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center px-4 bg-bg bg-glow-header text-text">
      <div className="flex flex-col items-center text-center gap-4 max-w-sm">
        <CircleAlert className="size-10 text-danger-text" aria-hidden="true" />
        <h1 className="font-display text-title font-bold text-balance">{MESSAGES.bootFailedTitle}</h1>
        <p className="text-text-muted">{MESSAGES.bootFailedText}</p>
        <Button onClick={onReload}>Reload</Button>
        <p className="text-sm text-text-muted">
          Error code <code className="font-mono text-text">{getErrorCode(error)}</code>
        </p>
      </div>
    </main>
  );
}
