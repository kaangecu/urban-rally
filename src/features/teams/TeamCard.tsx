/**
 * TeamCard Component
 * Individual team display card with cyberpunk/modern styling
 */

import type { Team } from '../../types/schema';

interface TeamCardProps {
  team: Team;
  onClick: () => void;
  useCyberpunk: boolean;
  isJoined: boolean;
}

export function TeamCard({ team, onClick, useCyberpunk, isJoined }: TeamCardProps) {
  const memberCount = team.memberCount || 0;
  const maxMembers = team.maxMembers || 20;
  const isFull = memberCount >= maxMembers;
  const percentage = Math.min((memberCount / maxMembers) * 100, 100);
  
  // Determine status
  const status = isJoined ? 'joined' : isFull ? 'full' : 'open';
  
  // Get team emoji/icon (use first emoji from team name or default)
  const getTeamEmoji = (teamName?: string) => {
    if (!teamName) return '👥';
    const emojiMatch = teamName.match(/[\u{1F300}-\u{1F9FF}]/u);
    return emojiMatch ? emojiMatch[0] : '👥';
  };
  
  const teamEmoji = getTeamEmoji(team.teamName || team.teamDisplayName);
  const teamDisplayName = team.teamDisplayName || team.teamName || `Team ${team.accessCode}`;

  if (useCyberpunk) {
    return <CyberpunkCard 
      team={team}
      teamDisplayName={teamDisplayName}
      teamEmoji={teamEmoji}
      status={status}
      memberCount={memberCount}
      maxMembers={maxMembers}
      percentage={percentage}
      onClick={onClick}
      isJoined={isJoined}
      isFull={isFull}
    />;
  }

  return <LightCard 
    team={team}
    teamDisplayName={teamDisplayName}
    teamEmoji={teamEmoji}
    status={status}
    memberCount={memberCount}
    maxMembers={maxMembers}
    percentage={percentage}
    onClick={onClick}
    isJoined={isJoined}
    isFull={isFull}
  />;
}

// Cyberpunk Theme Card
function CyberpunkCard({
  teamDisplayName,
  teamEmoji,
  status,
  memberCount,
  maxMembers,
  percentage,
  onClick,
  isFull
}: {
  team: Team;
  teamDisplayName: string;
  teamEmoji: string;
  status: string;
  memberCount: number;
  maxMembers: number;
  percentage: number;
  onClick: () => void;
  isJoined: boolean;
  isFull: boolean;
}) {
  // Status-based styling
  const config = {
    open: {
      wrapper: "hover:border-cyan-400/30 hover:scale-[1.01] cursor-pointer",
      glow: "from-cyan-500/10 to-blue-500/10",
      avatarBg: "from-cyan-500 to-blue-600",
      avatarShadow: "shadow-cyan-500/20",
      textHover: "group-hover:text-cyan-200",
      barBg: "bg-gradient-to-r from-cyan-400 to-blue-500",
      barShadow: "shadow-[0_0_10px_rgba(34,211,238,0.5)]",
      statusColor: "text-cyan-300",
      statusBg: "border-cyan-500/20 bg-cyan-500/10",
      statusIcon: (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
      )
    },
    full: {
      wrapper: "grayscale-[50%] opacity-80 cursor-not-allowed",
      glow: "hidden",
      avatarBg: "bg-gray-800",
      avatarShadow: "",
      textHover: "",
      barBg: "bg-red-900/50",
      barShadow: "",
      statusColor: "text-red-400",
      statusBg: "border-red-500/20 bg-red-500/10",
      statusIcon: null
    },
    joined: {
      wrapper: "border-green-500/30 cursor-pointer hover:scale-[1.01]",
      glow: "from-green-500/10 to-emerald-500/10",
      avatarBg: "from-green-500 to-emerald-600",
      avatarShadow: "shadow-green-500/20",
      textHover: "group-hover:text-green-200",
      barBg: "bg-gradient-to-r from-green-400 to-emerald-500",
      barShadow: "shadow-[0_0_10px_rgba(34,197,94,0.5)]",
      statusColor: "text-green-300",
      statusBg: "border-green-500/20 bg-green-500/10",
      statusIcon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const theme = config[status as keyof typeof config];

  return (
    <div 
      onClick={!isFull ? onClick : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl transition-all ${theme.wrapper}`}
    >
      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity ${theme.glow}`}></div>

      {/* Status Badge */}
      <div className={`absolute top-0 right-0 rounded-bl-xl border-l border-b px-3 py-1.5 backdrop-blur-md ${theme.statusBg}`}>
        <div className="flex items-center gap-1.5">
          {theme.statusIcon}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.statusColor}`}>
            {status === 'joined' ? 'Joined' : isFull ? 'Full Squad' : 'Open'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 flex items-center gap-4 mb-5">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br p-[1px] shadow-lg ${theme.avatarBg} ${theme.avatarShadow}`}>
          <div className="h-full w-full rounded-[10px] bg-gray-900 flex items-center justify-center text-xl">
            {teamEmoji}
          </div>
        </div>
        <h3 className={`text-white font-extrabold text-lg tracking-tight transition-colors ${theme.textHover}`}>
          {teamDisplayName}
        </h3>
      </div>

      {/* Capacity Bar */}
      <div className="relative z-10">
        <div className={`flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wide ${theme.statusColor}/70`}>
          <span>Capacity</span>
          <span>{memberCount} / {maxMembers} Members</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
          <div 
            style={{ width: `${percentage}%` }}
            className={`h-full transition-all duration-500 ${theme.barBg} ${theme.barShadow}`}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Light Theme Card
function LightCard({
  teamDisplayName,
  teamEmoji,
  status,
  memberCount,
  maxMembers,
  percentage,
  onClick,
  isFull
}: {
  team: Team;
  teamDisplayName: string;
  teamEmoji: string;
  status: string;
  memberCount: number;
  maxMembers: number;
  percentage: number;
  onClick: () => void;
  isJoined: boolean;
  isFull: boolean;
}) {
  const config = {
    open: {
      wrapper: "bg-white hover:shadow-lg cursor-pointer border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      bar: "bg-blue-500"
    },
    full: {
      wrapper: "bg-gray-50 opacity-75 cursor-not-allowed border-gray-300",
      badge: "bg-red-100 text-red-700",
      bar: "bg-red-500"
    },
    joined: {
      wrapper: "bg-green-50 hover:shadow-lg cursor-pointer border-green-300",
      badge: "bg-green-100 text-green-700",
      bar: "bg-green-500"
    }
  };

  const theme = config[status as keyof typeof config];

  return (
    <div 
      onClick={!isFull ? onClick : undefined}
      className={`rounded-xl border-2 p-5 shadow-md transition-all ${theme.wrapper}`}
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl shadow-sm">
            {teamEmoji}
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {teamDisplayName}
          </h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${theme.badge}`}>
          {status === 'joined' ? 'Joined' : isFull ? 'Full' : 'Open'}
        </span>
      </div>

      {/* Capacity Bar */}
      <div>
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
          <span>Capacity</span>
          <span>{memberCount} / {maxMembers} members</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            style={{ width: `${percentage}%` }}
            className={`h-full transition-all duration-500 ${theme.bar}`}
          ></div>
        </div>
      </div>
    </div>
  );
}
