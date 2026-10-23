import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

// The live region stays mounted so screen readers announce the change
export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <div role="status">
      {!online && (
        <div className="flex items-start gap-3 mb-4 px-4 py-3 rounded-control bg-warning-soft text-text ring-1 ring-inset ring-warning text-sm">
          <WifiOff className="size-6 shrink-0 text-warning-text" aria-hidden="true" />
          <p>
            <strong className="block text-base font-bold">You're offline</strong>
            You can still read tasks. Uploads need a connection, so send photos once you're back online.
          </p>
        </div>
      )}
    </div>
  );
}
