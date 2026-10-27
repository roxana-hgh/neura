import { useState } from "react";
import { addMonths, addWeeks, format, max, parseISO } from "date-fns";
import { Bell, Repeat } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWhen } from "@/features/reminders/lib/reminderTime";
import {
  useDeleteGoal, useExtendGoal, useGoalLinkedReminders, useSetGoalStatus,
} from "@/features/goals/hooks/useGoals";
import type { GoalBase, LinkedReminder } from "@/features/goals/types/goal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface BaseProps {
  goal: GoalBase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReminderRow({ r, children }: { r: LinkedReminder; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-sm">
      {children}
      <div className="min-w-0 flex-1">
        <p className="truncate">{r.title}</p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {r.repeat !== "none" ? <Repeat className="size-3" /> : <Bell className="size-3" />}
          {r.status === "paused" ? "Paused" : formatWhen(r.nextAt)}
        </p>
      </div>
    </div>
  );
}

/**
 * Complete or cancel. Reminders the goal created are turned off; the user picks which of
 * their own linked reminders stay on. Standalone reminders aren't listed — they're never touched.
 */
export function CloseGoalDialog({ goal, open, onOpenChange, status }: BaseProps & { status: "completed" | "cancelled" }) {
  const { data: reminders = [], isLoading } = useGoalLinkedReminders(goal.id, open);
  const setStatus = useSetGoalStatus();
  const [keep, setKeep] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // reset when the dialog opens (adjusting state during render, not in an effect)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setKeep([]);
      setNote("");
    }
  }

  const active = reminders.filter((r) => r.status === "active");
  const auto = active.filter((r) => r.origin === "goal_auto");
  const manual = active.filter((r) => r.origin === "manual");
  const completing = status === "completed";

  const confirm = () =>
    setStatus.mutate({ id: goal.id, status, keepReminderIds: keep, note }, {
      onSuccess: (res) => {
        onOpenChange(false);
        const off = res.reminderChanges.paused;
        const msg = completing ? "Goal completed 🎉" : "Goal cancelled";
        toast.default(off ? `${msg} · ${off} reminder${off === 1 ? "" : "s"} turned off` : msg, {
          action: { label: "Undo", onClick: () => setStatus.mutate({ id: goal.id, status: "active" }) },
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{completing ? "Complete" : "Cancel"} “{goal.title}”?</DialogTitle>
          <DialogDescription>
            {completing
              ? goal.progress < 100 ? `Progress is at ${goal.progress}% — you decide when it's done.` : "You reached your target. Nice work!"
              : "The goal stays in your history. You can reopen it any time."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="close-note">{completing ? "How did it go?" : "Why?"} <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="close-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={completing ? "A short reflection" : "e.g. priorities changed"} />
          </div>

          {isLoading ? (
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          ) : active.length > 0 && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Linked reminders</p>
              {auto.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {auto.length} automatic reminder{auto.length === 1 ? "" : "s"} will be turned off.
                </p>
              )}
              {manual.length > 0 && (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">Your reminders — tick the ones to keep on:</p>
                  <div className="mt-1 divide-y divide-border/60">
                    {manual.map((r) => (
                      <ReminderRow key={r.id} r={r}>
                        <Checkbox
                          checked={keep.includes(r.id)}
                          onCheckedChange={(c) => setKeep((k) => (c ? [...k, r.id] : k.filter((x) => x !== r.id)))}
                          aria-label={`Keep "${r.title}"`}
                        />
                      </ReminderRow>
                    ))}
                  </div>
                </>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">Reopening the goal turns them back on.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button onClick={confirm} disabled={setStatus.isPending} variant={completing ? "default" : "outline"}>
            {completing ? "Mark complete" : "Cancel goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Move the end date. Deadline and "until the goal ends" reminders move with it. */
export function ExtendGoalDialog({ goal, open, onOpenChange }: BaseProps) {
  const extend = useExtendGoal();
  // extending a goal whose deadline passed counts from today, not from the old end
  const base = max([parseISO(goal.endDate), new Date()]);
  const options = [
    { label: "+1 week", date: addWeeks(base, 1) },
    { label: "+2 weeks", date: addWeeks(base, 2) },
    { label: "+1 month", date: addMonths(base, 1) },
  ].map((o) => ({ ...o, key: format(o.date, "yyyy-MM-dd") }));

  const [endDate, setEndDate] = useState(options[0].key);
  const [note, setNote] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setEndDate(options[0].key);
      setNote("");
    }
  }

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(endDate) && endDate >= goal.startDate;

  const confirm = () =>
    extend.mutate({ id: goal.id, endDate, note }, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(`New end date: ${format(parseISO(endDate), "MMM d")}`);
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change the deadline</DialogTitle>
          <DialogDescription>Currently ends {format(parseISO(goal.endDate), "MMM d, yyyy")}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setEndDate(o.key)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
                  endDate === o.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extend-date">New end date</Label>
            <Input id="extend-date" type="date" min={goal.startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extend-note">Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="extend-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="What changed?" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            The deadline reminder and reminders that run until the goal ends move to the new date.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={!valid || extend.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Delete; the user decides whether their own linked reminders go too or become standalone. */
export function DeleteGoalDialog({ goal, open, onOpenChange, onDeleted }: BaseProps & { onDeleted: () => void }) {
  const { data: reminders = [] } = useGoalLinkedReminders(goal.id, open);
  const remove = useDeleteGoal();
  const [keepReminders, setKeepReminders] = useState(true);
  const manual = reminders.filter((r) => r.origin === "manual");

  const confirm = () =>
    remove.mutate({ id: goal.id, keepReminders }, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Goal deleted");
        onDeleted();
      },
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{goal.title}”?</DialogTitle>
          <DialogDescription>
            {goal.parentId ? "The sub-goal and its history" : "The goal, its sub-goals and its history"} will be removed.
            Linked tasks and notes are kept. This can't be undone{goal.parentId ? "" : " — archiving keeps it out of the way instead"}.
          </DialogDescription>
        </DialogHeader>

        {manual.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <p className="font-medium">{manual.length} reminder{manual.length === 1 ? "" : "s"} you added to this goal</p>
            {[
              { value: true, label: "Keep them as standalone reminders" },
              { value: false, label: "Delete them too" },
            ].map((o) => (
              <label key={String(o.value)} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="keep-reminders" checked={keepReminders === o.value} onChange={() => setKeepReminders(o.value)} className="accent-primary" />
                {o.label}
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={remove.isPending} className="bg-red-500 text-white hover:bg-red-600">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
