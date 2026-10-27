import { useState } from "react";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { CalendarClock, Flag, History, MessageSquare, Ruler, Sparkles, TrendingUp, X } from "lucide-react";
import SectionCard from "@/components/shared/SectionCard";
import { useAddGoalNote, useDeleteGoalLog } from "@/features/goals/hooks/useGoals";
import { METRIC_LABEL } from "@/features/goals/lib/goalPeriod";
import type { GoalBase, GoalLog, GoalMetric, GoalStatus } from "@/features/goals/types/goal";
import { STATUS_STYLES } from "@/features/goals/utils/goalStyles";

const ICONS = {
  created: Sparkles,
  progress: TrendingUp,
  note: MessageSquare,
  status: Flag,
  extended: CalendarClock,
  metric_changed: Ruler,
} as const;

function describe(log: GoalLog, goal: GoalBase): string {
  const m = log.meta ?? {};
  const unit = goal.unit ? ` ${goal.unit}` : "";
  switch (log.type) {
    case "created": return "Goal created";
    case "progress":
      return goal.metric === "manual" ? `Progress set to ${log.value}%` : `${m.from ?? "?"} → ${log.value}${unit}`;
    case "note": return "Note";
    case "status": {
      const to = STATUS_STYLES[m.to as GoalStatus]?.label ?? m.to;
      return m.from === "completed" || m.from === "cancelled" ? `Reopened (was ${String(m.from)})` : `Marked ${String(to).toLowerCase()}`;
    }
    case "extended": {
      const fmt = (k: unknown) => (typeof k === "string" ? format(parseISO(k), "MMM d") : "?");
      return `End date ${fmt(m.from)} → ${fmt(m.to)}`;
    }
    case "metric_changed":
      return `Measure changed to ${METRIC_LABEL[m.to as GoalMetric]?.toLowerCase() ?? m.to}`;
  }
}

/** Progress history + quick journal notes. */
export function GoalTimeline({ goal, logs }: { goal: GoalBase; logs: GoalLog[] }) {
  const addNote = useAddGoalNote();
  const deleteLog = useDeleteGoalLog();
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    addNote.mutate({ id: goal.id, note: note.trim() }, { onSuccess: () => setNote("") });
  };

  return (
    <SectionCard icon={<History className="size-4 text-primary" />} title="History">
      <form onSubmit={submit} className="mb-3">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="Write a quick update…"
          aria-label="Add a note to the history"
          className="h-9 w-full rounded-lg border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
      </form>
      <ol className="relative space-y-3 border-l border-border pl-4">
        {logs.map((log) => {
          const Icon = ICONS[log.type];
          return (
            <li key={log.id} className="group relative">
              <span className="absolute -left-[25px] flex size-4.5 items-center justify-center rounded-full border border-border bg-card">
                <Icon className="size-2.5 text-muted-foreground" />
              </span>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{describe(log, goal)}</p>
                  {log.note && <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{log.note}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground" title={format(new Date(log.createdAt), "PPpp")}>
                    {formatDistanceToNowStrict(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {log.type === "note" && (
                  <button
                    type="button"
                    onClick={() => deleteLog.mutate({ id: goal.id, logId: log.id })}
                    className="cursor-pointer rounded p-0.5 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
