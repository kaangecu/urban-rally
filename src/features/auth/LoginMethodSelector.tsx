/**
 * LoginMethodSelector Component
 * Landing screen that presents three join options:
 * 1. Browse Event (event code → see all teams)
 * 2. Join Team Directly (team code → direct join)
 * 3. Scan QR Code (instant join - coming soon)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirebaseAuth } from '../../services/firebase.service';
import { getUserTeams } from '../../services/teamMember.service';
import { Users } from 'lucide-react';

interface ActiveTeam {
  teamId: string;
  teamName?: string;
  accessCode: string;
  eventId: string;
  tenantId?: string;
  personalScore: number;
  role: 'owner' | 'member';
}

export function LoginMethodSelector() {
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const [activeTeams, setActiveTeams] = useState<ActiveTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  useEffect(() => {
    async function checkActiveTeams() {
      const user = auth.currentUser;
      if (!user) {
        setIsLoadingTeams(false);
        return;
      }

      try {
        const teams = await getUserTeams(user.uid);
        setActiveTeams(teams as ActiveTeam[]);
      } catch (error) {
        console.error('Error loading active teams:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    }

    checkActiveTeams();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 animate-bounce">⚡</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Join Urban Rally
          </h1>
          <p className="text-lg text-gray-600">
            How would you like to join?
          </p>
        </div>

        {/* Active Teams Banner */}
        {!isLoadingTeams && activeTeams.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-5 shadow-xl text-white">
            <div className="flex items-start gap-3">
              <div className="text-3xl mt-1">ℹ️</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Welcome Back! 👋
                </h3>
                <p className="text-blue-100 text-sm mb-3">
                  You're already in {activeTeams.length} team{activeTeams.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {activeTeams.slice(0, 3).map((team) => (
                    <button
                      key={team.teamId}
                      onClick={() => {
                        // Navigate to team's dashboard if we have tenantId
                        if (team.tenantId) {
                          navigate(`/tenant/${team.tenantId}/event/${team.eventId}/dashboard`);
                        } else {
                          // Fallback to events page
                          navigate('/events');
                        }
                      }}
                      className="w-full text-left px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl 
                               hover:bg-white/30 transition-all border border-white/20 hover:border-white/40
                               hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4" />
                            <p className="font-semibold text-white">
                              {team.teamName || team.accessCode}
                            </p>
                            {team.role === 'owner' && (
                              <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                                Owner
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-100">
                            Score: {team.personalScore} pts
                          </p>
                        </div>
                        <svg 
                          className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M13 7l5 5m0 0l-5 5m5-5H6" 
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
                {activeTeams.length > 3 && (
                  <p className="text-xs text-blue-200 mt-2 text-center">
                    +{activeTeams.length - 3} more team{activeTeams.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Method Cards */}
        <div className="space-y-4">
          {/* Option 1: Event Code - Browse Teams */}
          <button
            onClick={() => navigate('/join/event')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left group border-2 border-transparent hover:border-blue-300"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                🔍
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  Browse Event
                </h3>
                <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                  Explore teams, see who's playing, join when you're ready
                </p>
                <p className="text-blue-600 text-xs font-medium mb-3">
                  ✓ No signup required to browse
                </p>
                <div className="flex items-center text-blue-600 font-semibold text-sm">
                  <span>Best for exploring options</span>
                  <svg 
                    className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 7l5 5m0 0l-5 5m5-5H6" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Team Code - Direct Join */}
          <button
            onClick={() => navigate('/join/team')}
            className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left group border-2 border-transparent hover:border-green-300"
          >
            <div className="flex items-start space-x-4">
              <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                ⚡
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Have a Team Code?
                </h3>
                <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                  Join directly if you already know your team
                </p>
                <p className="text-green-600 text-xs font-medium mb-3">
                  ⚡ Fastest way to get started
                </p>
                <div className="flex items-center text-green-600 font-semibold text-sm">
                  <span>Enter Team Code</span>
                  <svg 
                    className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 7l5 5m0 0l-5 5m5-5H6" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: QR Code - Coming Soon */}
          <div className="relative">
            <div className="absolute -top-2 -right-2 z-10">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Coming Soon
              </span>
            </div>
            <button
              disabled
              className="w-full bg-gray-50 rounded-2xl shadow p-6 text-left opacity-70 cursor-not-allowed border-2 border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className="text-5xl opacity-50">
                  📷
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-700 mb-1">
                    Scan QR Code
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                    Instant join with camera (in development)
                  </p>
                  <div className="flex items-center text-gray-400 font-semibold text-sm">
                    <span>Feature in Development</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recovery Login Link */}
        <div className="mt-10 text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-500">
                Already joined?
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/login/recovery')}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium hover:underline transition-colors"
          >
            🔑 Use recovery code to access your account
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Choose the method that works best for you
          </p>
        </div>
      </div>
    </div>
  );
}
