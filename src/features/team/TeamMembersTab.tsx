/**
 * TeamMembersTab - Display team members with their individual contributions
 * Shows: name, personal score, tasks completed, role (owner/member)
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, CheckCircle, Crown, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getTeamMembers } from '../../services/teamMember.service';
import { isCyberpunkTheme } from '../../utils/theme';

interface TeamMemberDisplay {
  userId: string;
  displayName: string;
  email?: string;
  profilePhotoUrl?: string;
  personalScore: number;
  tasksCompleted: number;
  submissionCount: number;
  role: 'owner' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export const TeamMembersTab: React.FC = () => {
  const { team, tenant } = useAuthStore();
  const [members, setMembers] = useState<TeamMemberDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!team) return;

    const loadMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const teamMembers = await getTeamMembers(team.id);
        setMembers(teamMembers);
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [team]);

  if (!team || !tenant) {
    return null;
  }

  const useCyberpunk = isCyberpunkTheme(tenant);
  const maxMembers = team.maxMembers || 50;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 mb-6 ${
          useCyberpunk
            ? 'glass-card neon-border'
            : 'bg-white shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              useCyberpunk
                ? 'bg-purple-500/20 border border-purple-500/50'
                : 'bg-purple-100'
            }`}>
              <Users className={`w-6 h-6 ${
                useCyberpunk ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                useCyberpunk ? 'text-white' : 'text-gray-900'
              }`}>
                Team Members
              </h2>
              <p className={`text-sm ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {team.teamName || team.accessCode}
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full ${
            useCyberpunk
              ? 'bg-cyan-500/20 border border-cyan-500/50'
              : 'bg-blue-100'
          }`}>
            <span className={`text-sm font-semibold ${
              useCyberpunk ? 'text-cyan-400' : 'text-blue-600'
            }`}>
              {members.length} / {maxMembers}
            </span>
          </div>
        </div>

        {/* Team Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg text-center ${
            useCyberpunk
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50'
          }`}>
            <Trophy className={`w-5 h-5 mx-auto mb-2 ${
              useCyberpunk ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className={`text-2xl font-bold ${
              useCyberpunk ? 'text-white' : 'text-gray-900'
            }`}>
              {team.score}
            </div>
            <div className={`text-xs ${
              useCyberpunk ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Total Score
            </div>
          </div>

          <div className={`p-4 rounded-lg text-center ${
            useCyberpunk
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50'
          }`}>
            <CheckCircle className={`w-5 h-5 mx-auto mb-2 ${
              useCyberpunk ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className={`text-2xl font-bold ${
              useCyberpunk ? 'text-white' : 'text-gray-900'
            }`}>
              {team.completedTaskIds?.length || 0}
            </div>
            <div className={`text-xs ${
              useCyberpunk ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Tasks Done
            </div>
          </div>

          <div className={`p-4 rounded-lg text-center ${
            useCyberpunk
              ? 'bg-white/5 border border-white/10'
              : 'bg-gray-50'
          }`}>
            <Users className={`w-5 h-5 mx-auto mb-2 ${
              useCyberpunk ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <div className={`text-2xl font-bold ${
              useCyberpunk ? 'text-white' : 'text-gray-900'
            }`}>
              {members.length}
            </div>
            <div className={`text-xs ${
              useCyberpunk ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Members
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`w-8 h-8 animate-spin ${
            useCyberpunk ? 'text-cyan-400' : 'text-blue-600'
          }`} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg p-4 mb-6 ${
            useCyberpunk
              ? 'bg-red-500/10 border border-red-500/50'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${
              useCyberpunk ? 'text-red-400' : 'text-red-600'
            }`} />
            <p className={useCyberpunk ? 'text-red-400' : 'text-red-700'}>
              {error}
            </p>
          </div>
        </motion.div>
      )}

      {/* Members List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {members.map((member, index) => (
            <motion.div
              key={member.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg p-4 ${
                useCyberpunk
                  ? 'glass-card neon-border-subtle hover:neon-border transition-all'
                  : 'bg-white shadow hover:shadow-md transition-shadow'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Member Info */}
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar/Rank */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      member.role === 'owner'
                        ? useCyberpunk
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                          : 'bg-yellow-500'
                        : useCyberpunk
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-blue-500'
                    }`}>
                      <span className="text-white font-bold text-lg">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {member.role === 'owner' && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name and Role */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${
                        useCyberpunk ? 'text-white' : 'text-gray-900'
                      }`}>
                        {member.displayName}
                      </h3>
                      {member.role === 'owner' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          useCyberpunk
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Owner
                        </span>
                      )}
                    </div>
                    {member.email && (
                      <p className={`text-sm ${
                        useCyberpunk ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  {/* Personal Score */}
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      useCyberpunk
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent'
                        : 'text-blue-600'
                    }`}>
                      {member.personalScore}
                    </div>
                    <div className={`text-xs ${
                      useCyberpunk ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Score
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      useCyberpunk ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {member.tasksCompleted}
                    </div>
                    <div className={`text-xs ${
                      useCyberpunk ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Tasks
                    </div>
                  </div>

                  {/* Submissions */}
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      useCyberpunk ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>
                      {member.submissionCount}
                    </div>
                    <div className={`text-xs ${
                      useCyberpunk ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Submissions
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {members.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-12 rounded-lg ${
                useCyberpunk
                  ? 'glass-card'
                  : 'bg-white shadow'
              }`}
            >
              <Users className={`w-16 h-16 mx-auto mb-4 ${
                useCyberpunk ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-lg font-semibold mb-2 ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No team members yet
              </p>
              <p className={`text-sm ${
                useCyberpunk ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Share your team code to invite members!
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
