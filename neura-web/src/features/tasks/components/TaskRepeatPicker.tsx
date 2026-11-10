import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TaskRepeat } from "@/features/tasks/types/task";
import {
  describeTaskRepeat,
  REPEAT_UNIT,
  TASK_REPEAT_LABELS,
  WEEKDAY_SHORT,
} from "@/features/tasks/utils/taskRepeat";

export interface TaskRepeatValue {
  repeat: TaskRepeat;
  interval: number;
  weekdays: number[];
  /** "yyyy-MM-dd" or null for never */
  until: string | null;
}

interface IProps {
  value: TaskRepeatValue;
  onChange: (value: TaskRepeatValue) => void;
  /** The task's due day: weekly starts on its weekday and the series can't end before it. */
  dueDate: Date | undefined;
  error?: string;
}

/** Repeat rule of a task, laid out like the reminder form's: kind, every N, weekdays, end. */
function TaskRepeatPicker({ value, onChange, dueDate, error }: IProps) {
  const { repeat, interval, weekdays, until } = value;
  const set = (patch: Partial<TaskRepeatValue>) => onChange({ ...value, ...patch });

  const setRepeat = (next: TaskRepeat) => {
    // weekly starts on the due day's weekday
    const days = next === "weekly" && weekdays.length === 0 ? [(dueDate ?? new Date()).getDay()] : weekdays;
    set({ repeat: next, weekdays: days });
  };

  const toggleWeekday = (day: number) => {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day];
    set({ weekdays: next.length ? next : weekdays }); // keep at least one
  };

  const summary = describeTaskRepeat({ repeat, repeat_interval: interval || 1, repeat_weekdays: weekdays });
  const minEnd = dueDate ? format(dueDate, "yyyy-MM-dd") : undefined;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Repeat className="size-3.5" /> Repeat
      </Label>
      <Select value={repeat} onValueChange={(v) => setRepeat(v as TaskRepeat)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(TASK_REPEAT_LABELS) as TaskRepeat[]).map((r) => (
            <SelectItem key={r} value={r}>
              {TASK_REPEAT_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {repeat !== "none" && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Every</span>
            <Input
              type="number"
              min={1}
              max={365}
              className="h-8 w-16"
              value={Number.isNaN(interval) ? "" : interval}
              onChange={(e) => set({ interval: e.target.valueAsNumber })}
            />
            <span className="text-muted-foreground">
              {REPEAT_UNIT[repeat]}
              {interval > 1 ? "s" : ""}
            </span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}

          {repeat === "weekly" && (
            <div className="flex gap-1">
              {WEEKDAY_SHORT.map((label, day) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  aria-pressed={weekdays.includes(day)}
                  className={cn(
                    "h-7 flex-1 cursor-pointer rounded-md border text-[11px] font-medium transition",
                    weekdays.includes(day)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label.slice(0, 2)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ends</span>
            <button
              type="button"
              onClick={() => set({ until: null })}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs",
                until === null ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              Never
            </button>
            <button
              type="button"
              onClick={() => until === null && set({ until: minEnd ?? format(new Date(), "yyyy-MM-dd") })}
              className={cn(
                "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs",
                until !== null ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
              )}
            >
              On date
            </button>
            {until !== null && (
              <Input
                type="date"
                min={minEnd}
                className="h-8 w-40"
                value={until}
                onChange={(e) => set({ until: e.target.value || null })}
              />
            )}
          </div>

          {summary && (
            <p className="text-[11px] text-muted-foreground">
              {summary}. Checking it off adds the next one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskRepeatPicker;
