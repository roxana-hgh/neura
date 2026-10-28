import { useState } from "react";
import { Minus, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import ProgressCircle from "@/components/ui/progress-circle";
import { useRecordProgress } from "@/features/goals/hooks/useGoals";
import { METRIC_LABEL } from "@/features/goals/lib/goalPeriod";
import type { GoalBase } from "@/features/goals/types/goal";
import { goalColor, PACE_STYLES, progressValueLabel } from "@/features/goals/utils/goalStyles";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const MANUAL_STEPS = [
  { value: 0, label: "Not started" },
  { value: 25, label: "Getting going" },
  { value: 50, label: "Halfway" },
  { value: 75, label: "Almost there" },
  { value: 100, label: "Done" },
];

/** Numeric: add to / set the value. Manual: pick one of five steps. Both take an optional note. */
export function UpdateProgressPopover({ goal, trigger }: { goal: GoalBase; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "set">("add");
  const [amount, setAmount] = useState("");
  const [rating, setRating] = useState(goal.currentValue);
  const [note, setNote] = useState("");
  const record = useRecordProgress();

  const numeric = goal.metric === "numeric";
  const parsed = Number(amount);
  const valid = numeric ? amount.trim() !== "" && Number.isFinite(parsed) : true;

  const save = () => {
    const payload = numeric
      ? mode === "add" ? { delta: parsed } : { value: parsed }
      : { value: rating };
    record.mutate({ id: goal.id, ...payload, note }, {
      onSuccess: () => {
        setOpen(false);
        setAmount("");
        setNote("");
        toast.success("Progress saved");
      },
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setRating(goal.currentValue);
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <p className="text-sm font-medium">Update progress</p>
        {numeric ? (
          <>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5 text-xs">
              {(["add", "set"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn("cursor-pointer rounded-md py-1 font-medium transition", mode === m ? "bg-background shadow-sm" : "text-muted-foreground")}
                >
                  {m === "add" ? "Add to it" : "Set total"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {mode === "add" && (
                <Button type="button" variant="outline" size="icon-sm" onClick={() => setAmount(String((Number(amount) || 0) - 1))} aria-label="Minus one">
                  <Minus className="size-3.5" />
                </Button>
              )}
              <Input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valid && save()}
                placeholder={mode === "add" ? "+5" : String(goal.currentValue)}
                className="h-8 text-center"
              />
              {mode === "add" && (
                <Button type="button" variant="outline" size="icon-sm" onClick={() => setAmount(String((Number(amount) || 0) + 1))} aria-label="Plus one">
                  <Plus className="size-3.5" />
                </Button>
              )}
              {goal.unit && <span className="text-xs text-muted-foreground">{goal.unit}</span>}
            </div>
            {mode === "add" && valid && (
              <p className="text-[11px] text-muted-foreground">New total: {goal.currentValue + parsed}{goal.unit ? ` ${goal.unit}` : ""}</p>
            )}
          </>
        ) : (
          <div className="space-y-1">
            {MANUAL_STEPS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setRating(s.value)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm transition",
                  rating === s.value ? "bg-primary/10 text-primary" : "hover:bg-accent",
                )}
              >
                {s.label}
                <span className="text-xs tabular-nums text-muted-foreground">{s.value}%</span>
              </button>
            ))}
          </div>
        )}
        <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note (optional)" className="h-8" />
        <Button size="sm" className="w-full" onClick={save} disabled={!valid || record.isPending}>
          {record.isPending && <Spinner />} Save
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/** Big progress ring + the number + pace, and the way to move it for this kind of goal. */
export function GoalProgressPanel({ goal, onScrollTo }: { goal: GoalBase; onScrollTo: (section: "subgoals" | "tasks") => void }) {
  const color = goalColor(goal.color);
  const editable = goal.metric === "numeric" || goal.metric === "manual";
  const closed = goal.status === "completed" || goal.status === "cancelled";

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="relative shrink-0 self-center">
        <ProgressCircle percent={goal.progress} size={96} strokeWidth={9} colorClass={color.text} trackClass="text-muted" />
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{goal.progress}%</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{progressValueLabel(goal)}</p>
        <p className="text-xs text-muted-foreground">
          Measured by {METRIC_LABEL[goal.metric].toLowerCase()}
          {!closed && goal.expectedProgress > 0 && goal.expectedProgress < 100 && <> · {goal.expectedProgress}% of the time has passed</>}
        </p>
        {goal.pace && (
          <p className={cn("inline-flex items-center gap-1 text-sm font-medium", PACE_STYLES[goal.pace].text)}>
            <TrendingUp className="size-3.5" /> {PACE_STYLES[goal.pace].label}
          </p>
        )}
      </div>

      {!closed && (
        <div className="flex justify-center sm:justify-end">
          {editable ? (
            <UpdateProgressPopover goal={goal} trigger={<Button size="sm"><TrendingUp className="size-4" /> Update progress</Button>} />
          ) : (
            <Button size="sm" variant="outline" onClick={() => onScrollTo(goal.metric === "task" ? "tasks" : "subgoals")}>
              {goal.metric === "task" ? "Go to tasks" : "Go to milestones"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
