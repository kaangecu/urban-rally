import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { TeamCodeLogin } from './features/auth/TeamCodeLogin';
import { TaskList } from './features/tasks/TaskList';
import { TaskDetail } from './features/tasks/TaskDetail';

function App() {
  const { isAuthenticated, team, tenant } = useAuthStore();

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {tenant?.name || 'UrbanRally'}
            </h1>
            <p className="text-sm text-gray-600">
              Team: {team.teamName || team.accessCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary, #1a56db)' }}>
              {team.score} pts
            </p>
            <p className="text-xs text-gray-500">
              {team.completedTaskIds.length} tasks completed
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <TaskList />
      </main>

      {/* Task Detail Modal */}
      <TaskDetail />
    </div>
  );
}

export default App;
