import { useTaskStore } from '../../store/taskStore';
import { Toast } from '../../components/ui/Toast';

// App-level, so a task finished from the map or after leaving still confirms wherever the player is
export function TaskNotice() {
  const { notice, noticeTone, setNotice } = useTaskStore();
  return (
    // Always mounted so the confirmation is announced; it floats above the bottom nav
    <div className="fixed inset-x-0 bottom-28 z-[90] px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <Toast message={notice} tone={noticeTone} onDismiss={() => setNotice(null)} />
      </div>
    </div>
  );
}
