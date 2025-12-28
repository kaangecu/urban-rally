import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Trophy, Target, TrendingUp, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { getTasksByEvent, getAvailableTasks, getIncompleteTasks, getCompletedTasks, sortTasks, getTaskStats } from '../../services/task.service';
import { TaskCard } from './TaskCard';
import { isCyberpunkTheme } from '../../utils/theme';

export function TaskList() {
  const { team, tenant } = useAuthStore();
  const { 
    tasks, 
    isLoading, 
    error, 
    filter, 
    sortBy,
    setTasks, 
    setLoading, 
    setError,
    setFilter,
    setSortBy 
  } = useTaskStore();

  // Load tasks on mount
  useEffect(() => {
    if (!team || !tenant) return;

    const loadTasks = async () => {
      setLoading(true);
      try {
        const fetchedTasks = await getTasksByEvent(team.eventId, team.tenantId);
        setTasks(fetchedTasks);
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [team, tenant]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!team) return [];

    let filtered = tasks;

    // Apply filter
    switch (filter) {
      case 'available':
        const available = getAvailableTasks(tasks);
        filtered = getIncompleteTasks(available, team.completedTaskIds);
        break;
      case 'completed':
        filtered = getCompletedTasks(tasks, team.completedTaskIds);
        break;
      case 'all':
      default:
        filtered = tasks;
    }

    // Apply sort
    return sortTasks(filtered, sortBy);
  }, [tasks, filter, sortBy, team]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!team) return null;
    return getTaskStats(tasks, team.completedTaskIds);
  }, [tasks, team]);

  if (!team || !tenant) {
    return null;
  }

  const useCyberpunk = isCyberpunkTheme(tenant);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${
          useCyberpunk
            ? 'glass-card neon-border'
            : 'bg-white shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${
              useCyberpunk
                ? 'bg-purple-500/20 border border-purple-500/50'
                : 'bg-purple-100'
            }`}>
              <ListTodo className={`w-6 h-6 ${
                useCyberpunk ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                useCyberpunk ? 'text-white' : 'text-gray-900'
              }`}>
                Mission Tasks
              </h2>
              <p className={`text-sm ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Complete challenges to earn points
              </p>
            </div>
          </div>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Completed Tasks */}
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
                {stats.completed}
              </div>
              <div className={`text-xs ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Completed
              </div>
            </div>

            {/* Available Tasks */}
            <div className={`p-4 rounded-lg text-center ${
              useCyberpunk
                ? 'bg-white/5 border border-white/10'
                : 'bg-gray-50'
            }`}>
              <Target className={`w-5 h-5 mx-auto mb-2 ${
                useCyberpunk ? 'text-green-400' : 'text-green-600'
              }`} />
              <div className={`text-2xl font-bold ${
                useCyberpunk ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.incomplete}
              </div>
              <div className={`text-xs ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Available
              </div>
            </div>

            {/* Completion Rate */}
            <div className={`p-4 rounded-lg text-center ${
              useCyberpunk
                ? 'bg-white/5 border border-white/10'
                : 'bg-gray-50'
            }`}>
              <TrendingUp className={`w-5 h-5 mx-auto mb-2 ${
                useCyberpunk ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <div className={`text-2xl font-bold ${
                useCyberpunk ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.completionRate}%
              </div>
              <div className={`text-xs ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Progress
              </div>
            </div>

            {/* Points Earned */}
            <div className={`p-4 rounded-lg text-center ${
              useCyberpunk
                ? 'bg-white/5 border border-white/10'
                : 'bg-gray-50'
            }`}>
              <Sparkles className={`w-5 h-5 mx-auto mb-2 ${
                useCyberpunk ? 'text-cyan-400' : 'text-cyan-600'
              }`} />
              <div className={`text-2xl font-bold ${
                useCyberpunk
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent'
                  : 'text-gray-900'
              }`}>
                {stats.earnedPoints}/{stats.totalPoints}
              </div>
              <div className={`text-xs ${
                useCyberpunk ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Points
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'available'
                  ? useCyberpunk
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]'
                    : 'bg-blue-600 text-white'
                  : useCyberpunk
                  ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'completed'
                  ? useCyberpunk
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]'
                    : 'bg-blue-600 text-white'
                  : useCyberpunk
                  ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? useCyberpunk
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_15px_-3px_rgba(236,72,153,0.6)]'
                    : 'bg-blue-600 text-white'
                  : useCyberpunk
                  ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 ${
              useCyberpunk
                ? 'bg-white/5 border border-white/10 text-gray-300 focus:ring-purple-500 focus:border-purple-500'
                : 'bg-white border border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="points">Sort by Points</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="distance">Sort by Distance</option>
          </select>
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
          className={`rounded-lg p-4 ${
            useCyberpunk
              ? 'bg-red-500/10 border border-red-500/50'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${
              useCyberpunk ? 'text-red-400' : 'text-red-600'
            }`} />
            <div>
              <p className={`font-semibold ${
                useCyberpunk ? 'text-red-400' : 'text-red-700'
              }`}>
                Error
              </p>
              <p className={useCyberpunk ? 'text-red-400' : 'text-red-700'}>
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center py-12 rounded-2xl ${
            useCyberpunk
              ? 'glass-card'
              : 'bg-white shadow-md'
          }`}
        >
          <div className={`text-6xl mb-4 ${
            useCyberpunk ? 'opacity-50' : ''
          }`}>
            {filter === 'completed' ? '🏆' : '📝'}
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            useCyberpunk ? 'text-gray-300' : 'text-gray-900'
          }`}>
            {filter === 'completed' ? 'No completed tasks yet' : 'No tasks available'}
          </h3>
          <p className={`text-sm ${
            useCyberpunk ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {filter === 'completed' 
              ? 'Start completing tasks to see them here!'
              : 'Check back later for new challenges.'}
          </p>
        </motion.div>
      )}

      {/* Task Cards */}
      {!isLoading && !error && filteredAndSortedTasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedTasks.map((task, index) => {
            const completedTaskIds = Array.isArray(team.completedTaskIds) ? team.completedTaskIds : [];
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TaskCard
                  task={task}
                  isCompleted={completedTaskIds.includes(task.id)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
