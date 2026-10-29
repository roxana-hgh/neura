import { useState } from "react";
import { AlarmClock, BellOff, BellRing, CalendarClock, CheckCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import StatTile from "@/components/shared/StatTile";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { ReminderList } from "@/features/reminders/components/ReminderList";
import { ReminderQuickAdd } from "@/features/reminders/components/ReminderQuickAdd";
import { useReminderCounts } from "@/features/reminders/hooks/useReminders";
import type { ReminderView } from "@/features/reminders/types/reminder";

type Tab = Extract<ReminderView, "upcoming" | "snoozed" | "done">;

const EMPTY: Record<Tab, { icon: typeof BellRing; title: string; description: string }> = {
  upcoming: {
    icon: CalendarClock,
    title: "Nothing coming up",
    description: "Add a reminder above — no task or goal needed.",
  },
  snoozed: { icon: BellOff, title: "No snoozed reminders", description: "Snoozed reminders wait here until their new time." },
  done: { icon: CheckCheck, title: "Nothing done yet", description: "Reminders you finish show up here." },
};

export function RemindersPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const { data: counts, isLoading } = useReminderCounts();
  const empty = EMPTY[tab];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Stay on track"
        title="Reminders"
        description="Anything you want to remember at a certain time, on its own or tied to a goal, task or note."
        actions={

          <Button type="button" className="flex items-center gap-0.5" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" /> <span className="text-xs">New reminder</span>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <StatTile
          isLoading={isLoading}
          icon={<AlarmClock className="size-3.5 text-rose-500" />}
          label="Overdue"
          value={counts?.overdue ?? 0}
          hint={counts?.overdue ? "waiting for you" : "All caught up"}
        />
        <StatTile
          isLoading={isLoading}
          icon={<CalendarClock className="size-3.5 text-primary" />}
          label="Later today"
          value={counts?.today ?? 0}
        />
        <StatTile
          isLoading={isLoading}
          icon={<BellOff className="size-3.5 text-amber-500" />}
          label="Snoozed"
          value={counts?.snoozed ?? 0}
        />
      </div>

      <ReminderQuickAdd />

      <section className="rounded-xl border border-border bg-card p-2 sm:p-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-2 px-1">
          <TabsList>
            <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
            <TabsTrigger value="snoozed" className="gap-1.5 text-xs">
              Snoozed
              {!!counts?.snoozed && <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{counts.snoozed}</span>}
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        <ReminderList
          key={tab}
          view={tab}
          grouped={tab === "upcoming"}
          empty={<EmptyState compact icon={empty.icon} title={empty.title} description={empty.description} />}
        />
      </section>

      <ReminderFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
