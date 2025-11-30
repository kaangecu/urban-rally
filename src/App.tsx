import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { TeamCodeLogin } from './features/auth/TeamCodeLogin';

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
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Welcome to the game!
          </h2>
          <p className="text-gray-600 mb-8">
            You're successfully logged in as <strong>{team.teamName || team.accessCode}</strong>
          </p>
          
          {/* Placeholder for upcoming features */}
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Coming Soon:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li>📍 Interactive Map with Task Markers</li>
              <li>📸 Task List & Photo Submissions</li>
              <li>🏆 Live Leaderboard</li>
              <li>💡 Purchasable Hints</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
