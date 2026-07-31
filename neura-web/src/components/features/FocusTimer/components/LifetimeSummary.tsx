import { useFocusSessionStats } from "../hooks/useFocusSessions";
import { formatDuration } from "../utils/time";

function LifetimeSummary() {
  const { data: stats } = useFocusSessionStats("all");
  if (!stats || stats.sessionCount === 0) return null;

  return (
    <p className="mt-3 px-2 text-xs text-stone-500 dark:text-neutral-500">
      <span className="font-medium text-stone-700 dark:text-neutral-300">{stats.sessionCount}</span> sessions logged all-time ·{" "}
      <span className="font-medium text-stone-700 dark:text-neutral-300">{formatDuration(stats.totalDuration)}</span> total focus time
    </p>
  );
}

export default LifetimeSummary;
