import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { getTasksByEvent, getAvailableTasks, getIncompleteTasks, getCompletedTasks, sortTasks, getTaskStats } from '../../services/task.service';
import { TaskCard } from './TaskCard';

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

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h2>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.incomplete}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.earnedPoints}/{stats.totalPoints}</p>
              <p className="text-sm text-gray-600">Points</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
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
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="points">Sort by Points</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="distance">Sort by Distance</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-6xl mb-4">📝</p>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'completed' ? 'No completed tasks yet' : 'No tasks available'}
          </h3>
          <p className="text-gray-600">
            {filter === 'completed' 
              ? 'Start completing tasks to see them here!'
              : 'Check back later for new challenges.'}
          </p>
        </div>
      )}

      {/* Task Cards */}
      {!isLoading && !error && filteredAndSortedTasks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={team.completedTaskIds.includes(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
