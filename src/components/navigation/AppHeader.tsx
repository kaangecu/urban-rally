import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { ScoreReadout } from '../ui/ScoreReadout';

interface AppHeaderProps {
  teamName: string;
  eventName: string;
  score: number;
  onLogout: () => void;
}

export function AppHeader({ teamName, eventName, score, onLogout }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // The menu floats over moving content, so Escape and a tap outside close it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="ur-glass sticky top-0 z-10 border-b border-glass-edge">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div ref={wrapperRef} className="relative min-w-0">
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="font-display text-heading font-bold truncate">{teamName}</h1>
              <span className="text-sm text-text-muted truncate">{eventName}</span>
            </div>
            <button
              ref={toggleRef}
              type="button"
              aria-label="Team menu"
              aria-expanded={menuOpen}
              aria-controls="team-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid place-items-center size-touch shrink-0 rounded-control text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              <ChevronDown className="size-5" aria-hidden="true" />
            </button>
          </div>
          {menuOpen && (
            <div id="team-menu" className="absolute left-0 top-full mt-2 min-w-48 p-2 rounded-card bg-surface-raised border border-line shadow-card">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 min-h-touch px-3 rounded-control text-text hover:bg-surface focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <LogOut className="size-5" aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
        <ScoreReadout score={score} />
      </div>
    </header>
  );
}
