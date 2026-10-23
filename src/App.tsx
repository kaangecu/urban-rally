import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useTeamSync } from './hooks/useTeamSync';
import { TeamCodeLogin } from './features/auth/TeamCodeLogin';
import { TaskList } from './features/tasks/TaskList';
import { TaskDetail } from './features/tasks/TaskDetail';
import { GameMap } from './features/map/GameMap';
import { AppHeader } from './components/navigation/AppHeader';
import { BottomNav } from './components/navigation/BottomNav';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { applyTheme } from './utils/theme';

function App() {
  const { isAuthenticated, team, tenant, logout } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Real-time sync team data with Firestore
  useTeamSync();

  useEffect(() => {
    // Apply tenant theme if already logged in
    if (tenant) {
      // Apply theme using the new utility
      applyTheme(tenant);
      document.title = `${tenant.name} - UrbanRally`;
    }
  }, [tenant]);

  // Show login screen if not authenticated
  if (!isAuthenticated || !team) {
    return <TeamCodeLogin />;
  }

  // Authenticated - show main app
  return (
    <div className="min-h-screen relative bg-bg bg-glow-header text-text">
      <AppHeader
        teamName={team.teamName || team.accessCode}
        eventName={tenant?.name || 'UrbanRally'}
        score={team.score}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        <OfflineBanner />
        {viewMode === 'list' ? (
          <TaskList />
        ) : (
          <div className="h-[calc(100vh-200px)] -mx-4 -my-6">
            <GameMap />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Task Detail Modal - Renders at document level with high z-index */}
      <TaskDetail />
    </div>
  );
}

export default App;
