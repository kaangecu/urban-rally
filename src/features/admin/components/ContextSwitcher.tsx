import { useState, useRef, useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { ChevronDown, Check, Building2 } from 'lucide-react';

/**
 * ContextSwitcher Component - Phase 2 Milestone 2.2
 * 
 * Allows admins to switch between tenants they manage
 * 
 * Features:
 * - Dropdown with all available tenants
 * - Shows tenant logo and name
 * - Displays user's role in each tenant
 * - Active tenant marked with checkmark
 * - Auto-closes on outside click
 * - Mobile-optimized (44px tap targets)
 * - Triggers page reload on switch to prevent state leakage
 * 
 * Usage:
 * ```tsx
 * <ContextSwitcher />
 * ```
 * 
 * @version 1.0
 * @date December 30, 2025
 */

export function ContextSwitcher() {
  const { activeTenantId, availableTenants, switchTenant } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get active tenant
  const activeTenant = availableTenants.find((t) => t.id === activeTenantId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle tenant switch
  const handleSwitch = (tenantId: string) => {
    if (tenantId === activeTenantId) {
      setIsOpen(false);
      return;
    }
    switchTenant(tenantId); // This will reload the page
  };

  if (availableTenants.length === 0) {
    return null; // Hide if no tenants available
  }

  // If only one tenant, show it without dropdown
  if (availableTenants.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        {activeTenant?.logoUrl ? (
          <img
            src={activeTenant.logoUrl}
            alt=""
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <Building2 className="w-6 h-6 text-gray-400" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {activeTenant?.name || 'Unknown Tenant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {activeTenant?.userRole || 'player'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        aria-label="Switch tenant context"
        aria-expanded={isOpen}
      >
        {activeTenant?.logoUrl ? (
          <img
            src={activeTenant.logoUrl}
            alt=""
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <Building2 className="w-6 h-6 text-gray-400" />
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {activeTenant?.name || 'Select Tenant'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {activeTenant?.userRole || 'player'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="py-1">
            {availableTenants.map((tenant) => {
              const isActive = activeTenantId === tenant.id;
              const isExpiring =
                tenant.expiresAt && new Date(tenant.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSwitch(tenant.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {tenant.logoUrl ? (
                    <img
                      src={tenant.logoUrl}
                      alt=""
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {tenant.userRole}
                      </span>
                      {isExpiring && tenant.expiresAt && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Expires {new Date(tenant.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
