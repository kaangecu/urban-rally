import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useTeamSync } from './hooks/useTeamSync';
import { TeamCodeLogin } from './features/auth/TeamCodeLogin';
import { TaskList } from './features/tasks/TaskList';
import { TaskDetail } from './features/tasks/TaskDetail';
import { GameMap } from './features/map/GameMap';
import { TeamMembersTab } from './features/team/TeamMembersTab';
import { BottomNav } from './components/navigation/BottomNav';
import { applyTheme, isCyberpunkTheme } from './utils/theme';

function App() {
  const { isAuthenticated, team, tenant, logout } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'team'>('list');
  
  // Real-time sync team data with Firestore
  useTeamSync();
  
  // Check if current tenant uses cyberpunk theme
  const useCyberpunk = tenant ? isCyberpunkTheme(tenant) : false;

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
    <div className={`min-h-screen relative ${
      useCyberpunk 
        ? 'bg-[#050505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-[#000000]' 
        : 'bg-gray-100'
    }`}>
      {/* Header */}
      <header className={`${useCyberpunk ? 'glass-header' : 'bg-white'} shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={`text-xl font-bold ${useCyberpunk ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-gray-900'}`}>
                {tenant?.name || 'UrbanRally'}
              </h1>
              <p className={`text-sm ${useCyberpunk ? 'text-gray-400' : 'text-gray-600'}`}>
                Team: {team.teamName || team.accessCode}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-2xl font-bold ${useCyberpunk ? 'bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent' : ''}`} 
                   style={!useCyberpunk ? { color: 'var(--color-primary, #1a56db)' } : undefined}>
                  {team.score} pts
                </p>
                <p className={`text-xs ${useCyberpunk ? 'text-gray-500' : 'text-gray-500'}`}>
                  {team.completedTaskIds.length} tasks completed
                </p>
              </div>
              <button
                onClick={logout}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  useCyberpunk
                    ? 'glass-card-subtle neon-border text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {viewMode === 'list' ? (
          <TaskList />
        ) : viewMode === 'map' ? (
          <div className="h-[calc(100vh-200px)] -mx-4 -my-6">
            <GameMap />
          </div>
        ) : (
          <TeamMembersTab />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        teamScore={team.score}
        completedTasks={team.completedTaskIds.length}
      />

      {/* Task Detail Modal - Renders at document level with high z-index */}
      <TaskDetail />
    </div>
  );
}

export default App;
