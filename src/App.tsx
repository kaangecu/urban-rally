import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { TeamCodeLogin } from './features/auth/TeamCodeLogin';
import { TaskList } from './features/tasks/TaskList';
import { TaskDetail } from './features/tasks/TaskDetail';
import { GameMap } from './features/map/GameMap';

function App() {
  const { isAuthenticated, team, tenant, logout } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    // Apply tenant theme if already logged in
    if (tenant) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', tenant.primaryColor);
      if (tenant.secondaryColor) {
        root.style.setProperty('--color-secondary', tenant.secondaryColor);
      }
      document.title = `${tenant.name} - UrbanRally`;
    }
  }, [tenant]);

  // Show login screen if not authenticated
  if (!isAuthenticated || !team) {
    return <TeamCodeLogin />;
  }

  // Authenticated - show main app
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {tenant?.name || 'UrbanRally'}
              </h1>
              <p className="text-sm text-gray-600">
                Team: {team.teamName || team.accessCode}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary, #1a56db)' }}>
                  {team.score} pts
                </p>
                <p className="text-xs text-gray-500">
                  {team.completedTaskIds.length} tasks completed
                </p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🗺️ Map View
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'list' ? (
          <TaskList />
        ) : (
          <div className="h-[calc(100vh-200px)] -mx-4 -my-6">
            <GameMap />
          </div>
        )}
      </main>

      {/* Task Detail Modal - Renders at document level with high z-index */}
      <TaskDetail />
    </div>
  );
}

export default App;
