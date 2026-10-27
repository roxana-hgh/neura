import { Flame, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/features/habits/hooks/useHabits";
import { durationLabel, fromDayKey } from "@/features/habits/lib/habitDate";
import type { HabitActions } from "@/features/habits/components/HabitMenu";
import type { Habit } from "@/features/habits/types/habit";

interface HabitListModalProps extends HabitActions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HabitRow({ habit, onEdit, onDelete }: { habit: Habit } & HabitActions) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50">
      <span className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{habit.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {durationLabel(habit.durationDays)} · since {format(fromDayKey(habit.startKey), "MMM d, yyyy")}
        </p>
      </div>
      <span className="hidden items-center gap-1 text-xs tabular-nums text-muted-foreground sm:inline-flex" title="Best streak / check-ins">
        <Flame className="size-3.5 text-orange-500" /> {habit.streak.best}d · {habit.totalCompleted}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={() => onEdit(habit)} aria-label={`Edit ${habit.title}`}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={() => onDelete(habit)} aria-label={`Delete ${habit.title}`}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function HabitListModal({ open, onOpenChange, onEdit, onDelete }: HabitListModalProps) {
  const { data, isLoading } = useHabits("all", new Date());
  const active = data?.habits.filter((h) => !h.isArchived) ?? [];
  const archived = data?.habits.filter((h) => h.isArchived) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage habits</DialogTitle>
          <DialogDescription>Archived habits ended their duration. Edit one to extend it.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-1">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && data?.habits.length === 0 && <p className="text-sm text-muted-foreground">No habits yet.</p>}

          {[{ label: "Active", items: active }, { label: "Archived", items: archived }].map(
            ({ label, items }) =>
              items.length > 0 && (
                <section key={label} className="space-y-1">
                  <h4 className="px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label} · {items.length}
                  </h4>
                  {items.map((habit) => (
                    <HabitRow key={habit.id} habit={habit} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </section>
              ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
