import { useState, type ReactNode } from "react";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { ReminderItem } from "@/features/reminders/components/ReminderItem";
import { useReminders } from "@/features/reminders/hooks/useReminders";
import { GROUP_LABELS, groupOf, type ReminderGroup } from "@/features/reminders/lib/reminderTime";
import type { Reminder, ReminderFilters, ReminderView } from "@/features/reminders/types/reminder";
import { cn } from "@/lib/utils";

const GROUP_ORDER: ReminderGroup[] = ["overdue", "today", "tomorrow", "week", "later", "paused"];

interface ReminderListProps {
  view?: ReminderView;
  filters?: ReminderFilters;
  /** Group by Overdue / Today / Tomorrow / … */
  grouped?: boolean;
  /** Hide link chips (the list is already inside the linked item) */
  hideLinks?: boolean;
  empty: ReactNode;
  className?: string;
}

/** A self-contained reminder list (fetches, groups, and opens the edit dialog). Used by the Reminders page and goal pages. */
export function ReminderList({ view = "all", filters, grouped = false, hideLinks, empty, className }: ReminderListProps) {
  const { data, isLoading } = useReminders(view, filters);
  const [editing, setEditing] = useState<Reminder | null>(null);

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />)}
      </div>
    );
  }
  if (!data?.length) return <>{empty}</>;

  const done = view === "done";
  const row = (r: Reminder, i: number) => (
    <ReminderItem key={done ? `${r.id}-${i}` : r.id} reminder={r} onEdit={setEditing} done={done} hideLink={hideLinks} />
  );

  return (
    <div className={className}>
      {grouped && !done ? (
        <div className="space-y-4">
          {GROUP_ORDER.map((g) => {
            const items = data.filter((r) => groupOf(r) === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <p className={cn(
                  "px-2 pb-1 text-[11px] font-medium uppercase tracking-wide sm:px-3",
                  g === "overdue" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
                )}>
                  {GROUP_LABELS[g]} <span className="font-normal">· {items.length}</span>
                </p>
                <div className="divide-y divide-border/60">{items.map(row)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-border/60">{data.map(row)}</div>
      )}

      <ReminderFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} reminder={editing} />
    </div>
  );
}
