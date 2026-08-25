import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import { useHabits, useDeleteHabit } from "../hooks/useHabits";
import { EditHabitModal } from "./EditHabitModal";
import type { Habit } from "../../../../types/habit";

interface HabitListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function durationLabel(durationDays: number | null) {
  if (durationDays == null) return "No due date";
  if (durationDays % 30 === 0) return `${durationDays / 30} month${durationDays / 30 > 1 ? "s" : ""}`;
  if (durationDays % 7 === 0) return `${durationDays / 7} week${durationDays / 7 > 1 ? "s" : ""}`;
  return `${durationDays} day${durationDays > 1 ? "s" : ""}`;
}

export function HabitListModal({ open, onOpenChange }: HabitListModalProps) {
  const { data, isLoading } = useHabits("all", new Date());
  const deleteHabit = useDeleteHabit(); // keep the whole mutation object, don't destructure
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Habits</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-1 overflow-y-auto py-2">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

            {!isLoading && data?.habits.length === 0 && (
              <p className="text-sm text-muted-foreground">No habits yet.</p>
            )}

            {data?.habits.map((habit) => {
              const isDeletingThis = deleteHabit.isPending && deleteHabit.variables === habit.id;

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-4 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {habit.title}
                        {habit.isArchived && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">Archived</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{durationLabel(habit.durationDays)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(habit)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteHabit.mutate(habit.id)}
                      disabled={isDeletingThis}
                    >
                      {isDeletingThis ? (
                        <div className="w-3 h-3 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <EditHabitModal habit={editingHabit} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}