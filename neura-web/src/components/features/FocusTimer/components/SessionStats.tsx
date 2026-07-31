import { LucideClock } from "lucide-react";
import { useFocusSessionStats } from "../hooks/useFocusSessions";
import { useFocusTimerStore } from "../stores/focusTimerStore";
import { formatDuration, TAG_COLORS, TAG_LABELS } from "../utils/time";


function SessionStats() {
  const range = useFocusTimerStore((s) => s.historyRange);
  const { data: stats, isLoading } = useFocusSessionStats(range);

  if (isLoading || !stats) {
    return <div className="h-32 animate-pulse rounded-2xl border border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/5" />;
  }

  const tagEntries = Object.entries(stats.byTag).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...tagEntries.map(([, v]) => v), 1);

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/[0.03] p-4 md:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
          <LucideClock size={18} />
        </div>
        <div>
          <p className="text-sm text-stone-500 dark:text-neutral-400">Total focus time</p>
          <p className="text-2xl font-bold text-stone-900 dark:text-white">{formatDuration(stats.totalDuration)}</p>
        </div>
        <span className="ml-auto text-xs text-stone-400 dark:text-neutral-500">{stats.sessionCount} sessions</span>
      </div>

      {tagEntries.length > 0 ? (
        <div className="space-y-3">
          {tagEntries.map(([tagKey, seconds]) => (
            <div key={tagKey} className="flex items-center gap-3">
              <span className="w-20 text-xs text-stone-500 dark:text-neutral-400 shrink-0 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${TAG_COLORS[tagKey] ?? "bg-neutral-500"}`} />
                {TAG_LABELS[tagKey] ?? tagKey}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-stone-200 dark:bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${TAG_COLORS[tagKey] ?? "bg-neutral-500"}`}
                  style={{ width: `${(seconds / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-14 text-right text-xs text-stone-500 dark:text-neutral-400 shrink-0">
                {formatDuration(seconds)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 dark:text-neutral-500">No sessions logged for this period yet.</p>
      )}
    </div>
  );
}

export default SessionStats;
