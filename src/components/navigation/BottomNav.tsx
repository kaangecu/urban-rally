import { ListChecks, Map } from 'lucide-react';

type ViewMode = 'list' | 'map';

interface BottomNavProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const TABS = [
  { mode: 'list', label: 'Tasks', Icon: ListChecks },
  { mode: 'map', label: 'Map', Icon: Map },
] as const;

// Floating glass pill; the score lives in the header, not here
export function BottomNav({ viewMode, onViewModeChange }: BottomNavProps) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto rounded-pill shadow-nav">
        <div className="ur-glass grid grid-cols-2 min-h-nav rounded-pill">
          {TABS.map(({ mode, label, Icon }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onViewModeChange(mode)}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-touch rounded-pill font-display text-label font-semibold uppercase focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                  active ? 'text-accent-text' : 'text-text-muted'
                }`}
              >
                {active && (
                  <span aria-hidden="true" className="absolute top-1.5 left-[34%] right-[34%] h-[3px] rounded-pill bg-accent shadow-glow-accent" />
                )}
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
