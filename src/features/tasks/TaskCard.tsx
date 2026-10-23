import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Task } from '../../types/schema';
import { useTaskStore } from '../../store/taskStore';
import { Badge } from '../../components/ui/Badge';
import { DifficultyMeter } from '../../components/ui/DifficultyMeter';
import { TaskTypeTag } from '../../components/ui/TaskTypeTag';
import { formatDistance } from '../../utils/geo.utils';
import { formatPoints } from '../../utils/format';
import { getTaskTypeInfo } from '../../utils/taskTypes';

interface TaskCardProps {
  task: Task;
  isCompleted: boolean;
  /** Metres from the player, when their location is known */
  distance?: number;
}

const DIFFICULTY_LEVEL = { easy: 1, medium: 2, hard: 3 } as const;

export function TaskCard({ task, isCompleted, distance }: TaskCardProps) {
  const { setSelectedTask } = useTaskStore();
  const [imageError, setImageError] = useState(false);
  const { label, Icon } = getTaskTypeInfo(task.type);

  return (
    <article
      className={`relative grid grid-cols-[88px_1fr] gap-3 p-3 rounded-card bg-surface text-text shadow-card border ${
        isCompleted ? 'border-progress' : 'border-line'
      } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2`}
    >
      <div className="size-[88px] grid place-items-center overflow-hidden rounded-control bg-surface-raised text-text-faint">
        {task.imageUrl && !imageError ? (
          <img src={task.imageUrl} alt="" className="size-full object-cover" onError={() => setImageError(true)} />
        ) : (
          <Icon className="size-8" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-col items-start gap-2 min-w-0">
        <TaskTypeTag label={label} Icon={Icon} sponsored={!!task.sponsorName} />
        <h3 className="font-display text-heading font-semibold text-balance">
          {/* The whole card is the tap target */}
          <button
            type="button"
            onClick={() => setSelectedTask(task)}
            className="text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
          >
            {task.title}
          </button>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {task.difficulty && <DifficultyMeter level={DIFFICULTY_LEVEL[task.difficulty]} />}
          {isCompleted ? (
            <Badge variant="done" Icon={Check}>{formatPoints(task.points)} earned</Badge>
          ) : (
            <Badge variant="points">{formatPoints(task.points, { signed: true })}</Badge>
          )}
          {distance !== undefined && (
            <span className="font-mono text-sm font-medium text-text-muted">{formatDistance(distance)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
