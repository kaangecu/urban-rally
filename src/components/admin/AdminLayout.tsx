import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAdminStore } from '../../store/adminStore';
import { ContextSwitcher } from '../../features/admin/components/ContextSwitcher';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase.service';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminProfile } = useAdminAuth();
  const { clearAdminState, getActiveRole, activeTenantId, availableTenants } = useAdminStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeRole = getActiveRole();
  const activeTenant = availableTenants.find((t: { id: string }) => t.id === activeTenantId);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearAdminState();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: 'Events',
      path: '/admin/events',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      requiredRole: 'organizer',
    },
  ];

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4 sticky top-0 z-50">
        <h1 className="text-lg font-bold text-white font-mono">
          URBAN<span className="text-blue-500">RALLY</span>
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer / Desktop Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-full z-40
          w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          md:h-screen
        `}
      >
        {/* Logo/Brand - Desktop Only */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white font-mono">
            URBAN<span className="text-blue-500">RALLY</span>
          </h1>
        </div>

        {/* Mobile Header in Drawer */}
        <div className="md:hidden h-16 flex items-center justify-between px-6 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white font-mono">
            URBAN<span className="text-blue-500">RALLY</span>
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  min-h-[44px] touch-manipulation
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white active:bg-slate-700'
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tenant Context Switcher */}
        <div className="px-4 pt-2 pb-4">
          <ContextSwitcher />
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-600/50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-500 font-mono">
                {adminProfile?.displayName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminProfile?.displayName || 'Admin'}
              </p>
              <p className="text-xs text-slate-400 uppercase font-mono truncate">
                {activeRole || adminProfile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:h-screen">
        {children}
      </main>
    </div>
  );
}
