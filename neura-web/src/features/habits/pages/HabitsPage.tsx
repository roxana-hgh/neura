import { useEffect, useState } from "react";
import { Plus, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import AlertDialog from "@/components/shared/AlertDialog";
import { useDeleteHabit, useHabits, useToggleHabitEntry } from "@/features/habits/hooks/useHabits";
import { useHabitsStore } from "@/features/habits/stores/habitsStore";
import { formatRangeTitle, shiftAnchor } from "@/features/habits/lib/habitDate";
import { HabitsHeader } from "@/features/habits/components/HabitsHeader";
import { HabitsSummary } from "@/features/habits/components/HabitsSummary";
import { HabitFormModal } from "@/features/habits/components/HabitFormModal";
import { HabitListModal } from "@/features/habits/components/HabitListModal";
import { WeekGrid } from "@/features/habits/components/WeekGrid";
import { MonthCalendar } from "@/features/habits/components/MonthCalendar";
import { YearHeatmap } from "@/features/habits/components/YearHeatmap";
import type { Habit, HabitView } from "@/features/habits/types/habit";
import { toast } from "@/lib/toast";

const VIEW_KEYS: Record<string, HabitView> = { w: "week", m: "month", y: "year", a: "all" };

// Ignore shortcuts while typing or while a dialog is open
function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return true;
  return !!document.querySelector('[role="dialog"], [role="menu"]');
}

function Legend() {
  const items = [
    { label: "Done", className: "bg-primary" },
    { label: "Not done", className: "bg-muted" },
    { label: "Not tracked", className: "bg-muted/35" },
    { label: "Upcoming", className: "border border-dashed border-border" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`size-3 rounded-[3px] ${i.className}`} />
          {i.label}
        </span>
      ))}
      <span>Click any past day to check it off or undo it.</span>
    </div>
  );
}

export function HabitsPage() {
  const view = useHabitsStore((s) => s.view);
  const setView = useHabitsStore((s) => s.setView);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const [formOpen, setFormOpen] = useState(false);
  const [formHabit, setFormHabit] = useState<Habit | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [deleting, setDeleting] = useState<Habit | null>(null);

  const { data, isLoading, isFetching, isPlaceholderData } = useHabits(view, anchorDate);
  const toggleEntry = useToggleHabitEntry();
  const deleteHabit = useDeleteHabit();

  const openCreate = () => {
    setFormHabit(null);
    setFormOpen(true);
  };
  const openEdit = (habit: Habit) => {
    setFormHabit(habit);
    setFormOpen(true);
  };
  const onToggle = (habitId: string, date: string) => toggleEntry.mutate({ habitId, date });
  const confirmDelete = () => {
    if (!deleting) return;
    const { id, title } = deleting;
    deleteHabit.mutate(id, { onSuccess: () => toast.success(`"${title}" deleted`) });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e)) return;
      const key = e.key.toLowerCase();
      if (e.key === "ArrowLeft") setAnchorDate((d) => shiftAnchor(view, d, -1));
      else if (e.key === "ArrowRight") setAnchorDate((d) => shiftAnchor(view, d, 1));
      else if (key === "t") setAnchorDate(new Date());
      else if (key === "n") {
        setFormHabit(null);
        setFormOpen(true);
      } else if (VIEW_KEYS[key]) setView(VIEW_KEYS[key]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, setView]);

  const isCurrentPeriod = !!data && data.rangeStart <= data.today && data.today <= data.rangeEnd;
  const actions = { onEdit: openEdit, onDelete: setDeleting, onToggle };

  return (
    <div className="space-y-5">
      <HabitsHeader
        title={data ? formatRangeTitle(view, data.rangeStart, data.rangeEnd) : "Habits"}
        view={view}
        isFetching={isFetching && (isPlaceholderData || !data)}
        isCurrentPeriod={isCurrentPeriod}
        onViewChange={setView}
        onPrev={() => setAnchorDate((d) => shiftAnchor(view, d, -1))}
        onNext={() => setAnchorDate((d) => shiftAnchor(view, d, 1))}
        onToday={() => setAnchorDate(new Date())}
        onManage={() => setListOpen(true)}
        onCreate={openCreate}
      />

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-21 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      )}

      {data && (
        <>
          <HabitsSummary data={data} view={view} />

          {data.habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sprout className="size-6" />
              </div>
              {isCurrentPeriod || view === "all" ? (
                <>
                  <div>
                    <p className="font-medium">Build your first habit</p>
                    <p className="text-sm text-muted-foreground">Pick something small you can do every day.</p>
                  </div>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" /> New habit
                  </Button>
                </>
              ) : (
                <div>
                  <p className="font-medium">No habits in this period</p>
                  <p className="text-sm text-muted-foreground">
                    None of your habits were running then. Edit a habit's start date to backfill it.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
              {view === "week" && (
                <WeekGrid habits={data.habits} rangeStart={data.rangeStart} today={data.today} {...actions} />
              )}
              {view === "month" && (
                <MonthCalendar
                  habits={data.habits}
                  rangeStart={data.rangeStart}
                  rangeEnd={data.rangeEnd}
                  today={data.today}
                  {...actions}
                />
              )}
              {(view === "year" || view === "all") && (
                <YearHeatmap
                  habits={data.habits}
                  view={view}
                  rangeStart={data.rangeStart}
                  rangeEnd={data.rangeEnd}
                  today={data.today}
                  {...actions}
                />
              )}
            </div>
          )}

          {data.habits.length > 0 && <Legend />}
        </>
      )}

      <HabitFormModal habit={formHabit} open={formOpen} onOpenChange={setFormOpen} />
      <HabitListModal open={listOpen} onOpenChange={setListOpen} onEdit={openEdit} onDelete={setDeleting} />
      <AlertDialog
        open={!!deleting}
        setOpen={(open) => !open && setDeleting(null)}
        title="Delete habit?"
        description={`"${deleting?.title ?? ""}" and its whole check-in history will be removed. This can't be undone.`}
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
