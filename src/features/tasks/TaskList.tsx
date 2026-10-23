import { useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { getTasksByEvent, getAvailableTasks, getIncompleteTasks, getCompletedTasks, sortTasks, getTaskStats } from '../../services/task.service';
import { useMapStore } from '../../store/mapStore';
import { calculateDistance } from '../../utils/geo.utils';
import { formatPoints } from '../../utils/format';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Skeleton } from '../../components/ui/Skeleton';
import { TaskCard } from './TaskCard';
import { ClipboardList } from 'lucide-react';

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
  } = useTaskStore();
  const userLocation = useMapStore((state) => state.userLocation);

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

  // Nearest first once the player's location is known
  const effectiveSort = userLocation ? 'distance' : sortBy;

  const filteredAndSortedTasks = useMemo(() => {
    if (!team) return [];
    const filtered =
      filter === 'completed'
        ? getCompletedTasks(tasks, team.completedTaskIds)
        : filter === 'available'
          ? getIncompleteTasks(getAvailableTasks(tasks), team.completedTaskIds)
          : tasks;
    return sortTasks(filtered, effectiveSort, userLocation);
  }, [tasks, filter, effectiveSort, userLocation, team]);

  const stats = useMemo(() => {
    if (!team) return null;
    return getTaskStats(tasks, team.completedTaskIds);
  }, [tasks, team]);

  if (!team || !tenant) {
    return null;
  }

  const chips = [
    { value: 'available', label: 'To do', count: stats?.incomplete ?? 0 },
    { value: 'completed', label: 'Done', count: stats?.completed ?? 0 },
  ] as const;

  const showSkeleton = isLoading && tasks.length === 0;
  const ready = !showSkeleton && !error;

  return (
    <div className="flex flex-col gap-4">
      {ready && stats && stats.total > 0 && (
        <ProgressBar
          label="Progress"
          value={stats.completed}
          max={stats.total}
          valueText={`${stats.completed} / ${stats.total} tasks · ${stats.earnedPoints} / ${formatPoints(stats.totalPoints)}`}
        />
      )}

      {ready && tasks.length > 0 && (
        <div className="flex gap-2">
          {chips.map(({ value, label, count }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={`inline-flex items-center gap-2 min-h-touch px-4 rounded-pill border font-display text-label font-semibold uppercase focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                  active ? 'bg-accent-soft border-accent text-accent-text' : 'bg-surface border-line-strong text-text'
                }`}
              >
                {label}{' '}
                <span className="font-mono tracking-normal">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {showSkeleton && (
        <div role="status" aria-label="Loading tasks" className="flex flex-col gap-3">
          <Skeleton shape="card" />
          <Skeleton shape="card" />
          <Skeleton shape="card" />
        </div>
      )}

      {error && <Alert variant="danger" title="Tasks didn't load" text={error} />}

      {ready && tasks.length === 0 && (
        <EmptyState
          Icon={ClipboardList}
          title="No tasks yet"
          text="Your organisers open tasks when the event starts. Check back then."
        />
      )}

      {ready && tasks.length > 0 && filteredAndSortedTasks.length === 0 && (
        filter === 'completed' ? (
          <EmptyState
            Icon={ClipboardList}
            title="Nothing done yet"
            text="Tasks you finish show up here."
            actionLabel="Show tasks to do"
            onAction={() => setFilter('available')}
          />
        ) : (
          <EmptyState Icon={ClipboardList} title="No tasks to do" text="You've done every open task. New ones may still unlock." />
        )
      )}

      {ready && filteredAndSortedTasks.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedTasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                isCompleted={team.completedTaskIds.includes(task.id)}
                distance={userLocation && task.coordinates ? calculateDistance(userLocation, task.coordinates) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
