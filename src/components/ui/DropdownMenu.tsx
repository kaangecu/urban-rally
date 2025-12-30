import { useEffect, useRef } from 'react';

/**
 * DropdownMenu Component (Atomic Design - Molecule)
 * 
 * Reusable dropdown menu with click-away handling
 * 
 * Features:
 * - Auto-closes when clicking outside
 * - Customizable positioning
 * - Keyboard escape support
 * - Portal-free implementation for z-index management
 * 
 * Usage:
 * ```tsx
 * <DropdownMenu
 *   isOpen={showMenu}
 *   onClose={() => setShowMenu(false)}
 *   trigger={<button>Open Menu</button>}
 * >
 *   <button onClick={handleAction}>Action 1</button>
 *   <button onClick={handleAction}>Action 2</button>
 * </DropdownMenu>
 * ```
 */

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
  className = '',
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners after a small delay to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {trigger}

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownMenuItem Component (Atomic Design - Atom)
 * 
 * Individual menu item with consistent styling
 */

interface DropdownMenuItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  title?: string;
}

export function DropdownMenuItem({
  onClick,
  icon,
  children,
  disabled = false,
  variant = 'default',
  title,
}: DropdownMenuItemProps) {
  const baseClasses = 'w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg';
  
  const variantClasses = {
    default: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}
