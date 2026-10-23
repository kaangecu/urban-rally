import { useId, useState } from 'react';
import { Camera, Lock, MapPin, Navigation, PenLine, Star, Video, type LucideIcon } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { useMapStore } from '../../store/mapStore';
import { useWatchPosition } from '../../hooks/useWatchPosition';
import { Alert } from '../../components/ui/Alert';
import { TaskSubmission } from '../submissions/TaskSubmission';
import { formatPoints } from '../../utils/format';
import { calculateDistance, formatDistance } from '../../utils/geo.utils';
import { getTaskAction, getTaskTypeInfo } from '../../utils/taskTypes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DifficultyMeter } from '../../components/ui/DifficultyMeter';
import { Sheet } from '../../components/ui/Sheet';
import { TaskTypeTag } from '../../components/ui/TaskTypeTag';

const DIFFICULTY_LEVEL = { easy: 1, medium: 2, hard: 3 } as const;

function Requirement({ Icon, children }: { Icon: LucideIcon; children: string }) {
  return (
    <li className="flex items-center gap-3 min-h-touch text-text">
      <Icon className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
      {children}
    </li>
  );
}

export function TaskDetail() {
  const { selectedTask, setSelectedTask } = useTaskStore();
  const { team, recordCompletion } = useAuthStore();
  const setNotice = useTaskStore((state) => state.setNotice);
  const userLocation = useMapStore((state) => state.userLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tooFarId = useId();

  const isCheckIn = selectedTask?.type === 'GPS' || selectedTask?.type === 'GPS_LOCATION';
  const isCompleted = (selectedTask && team?.completedTaskIds.includes(selectedTask.id)) || false;
  // Check-ins need the player on the spot, so follow them while the detail is open
  const watched = useWatchPosition(!!selectedTask?.coordinates && isCheckIn && !isCompleted && !isSubmitting);

  if (!selectedTask) return null;

  const task = selectedTask;
  const { label, Icon } = getTaskTypeInfo(task.type);
  const here = watched.position ?? userLocation;
  const distance = here && task.coordinates ? calculateDistance(here, task.coordinates) : null;
  const radius = task.radius || 50;
  // Only block when even the most generous reading of the fix is out of range; the server re-checks anyway
  const tooFar = isCheckIn && distance !== null && distance - watched.accuracy > radius;
  const close = () => setSelectedTask(null);

  return (
    <>
      <Sheet
        open={!isSubmitting}
        title={task.title}
        onClose={close}
        footer={
          isCompleted ? (
            <Button variant="secondary" block onClick={close}>
              Close
            </Button>
          ) : (
            <Button
              block
              size="lg"
              disabled={tooFar}
              aria-describedby={tooFar ? tooFarId : undefined}
              onClick={() => setIsSubmitting(true)}
            >
              <Icon className="size-5" aria-hidden="true" />
              {getTaskAction(task.type)}
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {task.imageUrl && <img src={task.imageUrl} alt="" className="w-full h-40 object-cover rounded-card" />}

          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeTag label={label} Icon={Icon} sponsored={!!task.sponsorName} />
            {task.difficulty && <DifficultyMeter level={DIFFICULTY_LEVEL[task.difficulty]} />}
            {isCompleted ? (
              <Badge variant="done">{formatPoints(task.points)} earned</Badge>
            ) : (
              <Badge variant="points">{formatPoints(task.points, { signed: true })}</Badge>
            )}
          </div>

          {tooFar && distance !== null && (
            <div id={tooFarId} className="flex flex-col gap-1">
              {/* The live region only changes when the player crosses in or out of range, not on every fix */}
              <Alert variant="warning" title="Too far away" />
              <p className="text-sm text-text-muted">{`You're ${Math.round(distance)} m away. Get within ${radius} m.`}</p>
            </div>
          )}

          {isCheckIn && watched.denied && !here && (
            <Alert variant="warning" title="Turn on location to check in" />
          )}

          {distance !== null && !tooFar && (
            <p className="flex items-center gap-2 font-mono text-sm text-text-muted">
              <Navigation className="size-4" aria-hidden="true" />
              {formatDistance(distance)} away
            </p>
          )}

          {task.description && <p className="text-text">{task.description}</p>}

          <section>
            <h3 className="font-display text-label font-semibold uppercase text-text-muted">Requirements</h3>
            <ul>
              {isCheckIn && <Requirement Icon={MapPin}>{`Be within ${radius} m of the place`}</Requirement>}
              {task.requiresPhoto && <Requirement Icon={Camera}>Take a photo</Requirement>}
              {task.requiresVideo && <Requirement Icon={Video}>Record a video</Requirement>}
              {task.requiresText && <Requirement Icon={PenLine}>Write an answer</Requirement>}
            </ul>
          </section>

          {task.bonusPoints ? (
            <p className="text-text-muted">Bonus available: {formatPoints(task.bonusPoints, { signed: true })}</p>
          ) : null}

          {task.sponsorName && (
            <p className="flex items-center gap-2 text-text-muted">
              <Star className="size-5 text-attention-text" aria-hidden="true" />
              Sponsored by <span className="font-bold text-text">{task.sponsorName}</span>
            </p>
          )}

          {task.hints && task.hints.length > 0 && (
            <section>
              <h3 className="font-display text-label font-semibold uppercase text-text-muted">Hints</h3>
              <ul className="flex flex-col gap-2 mt-2">
                {task.hints.map((hint, index) => (
                  <li key={hint.id} className="flex items-center justify-between gap-3 p-3 rounded-control bg-surface border border-line">
                    <span className="flex flex-col">
                      <span className="font-bold text-text">Hint {index + 1}</span>
                      <span className="font-mono text-sm text-text-muted">Costs {formatPoints(hint.cost)}</span>
                    </span>
                    <Button variant="secondary">
                      <Lock className="size-4" aria-hidden="true" />
                      Unlock
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Sheet>

      {/* Capture opens straight from the primary button */}
      {isSubmitting && !isCompleted && (
        <TaskSubmission
          task={task}
          onSuccess={(points) => {
            recordCompletion(task.id, points);
            setNotice(`Sent! ${formatPoints(points, { signed: true })}. Organisers can still reject it.`);
            setIsSubmitting(false);
            // Only close if the player is still on this task
            if (useTaskStore.getState().selectedTask?.id === task.id) setSelectedTask(null);
          }}
          onCancel={() => setIsSubmitting(false)}
        />
      )}
    </>
  );
}
