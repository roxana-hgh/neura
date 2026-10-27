import { useState } from "react";
import { Archive, CircleAlert, Flag, Plus, Target, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import StatTile from "@/components/shared/StatTile";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { GoalFormDialog } from "@/features/goals/components/GoalFormDialog";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { PERIOD_OPTIONS } from "@/features/goals/lib/goalPeriod";
import type { Goal } from "@/features/goals/types/goal";

type Tab = "active" | "closed" | "archived";

const EXAMPLES = ["Read 4 books this quarter", "Run 50 km this month", "Save $1,000 by the end of the year"];

function GoalGrid({ goals }: { goals: Goal[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
    </div>
  );
}

function Group({ title, goals, tone }: { title: string; goals: Goal[]; tone?: "review" }) {
  if (!goals.length) return null;
  return (
    <section className="space-y-2.5">
      <h2 className={tone === "review" ? "px-1 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400" : "px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"}>
        {title} <span className="font-normal">· {goals.length}</span>
      </h2>
      <GoalGrid goals={goals} />
    </section>
  );
}

export function GoalsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [initialTitle, setInitialTitle] = useState("");
  const { data: goals = [], isLoading } = useGoals(false);
  const archived = useGoals(true);

  const open = goals.filter((g) => g.status === "active" || g.status === "paused");
  const closed = goals.filter((g) => g.status === "completed" || g.status === "cancelled");
  const review = open.filter((g) => g.needsReview);
  const onTrack = open.filter((g) => g.pace === "on_track" || g.pace === "ahead").length;
  const thisYear = new Date().getFullYear();
  const completedThisYear = [...closed, ...(archived.data ?? [])].filter(
    (g) => g.status === "completed" && g.completedAt && new Date(g.completedAt).getFullYear() === thisYear,
  ).length;

  const create = (title = "") => {
    setInitialTitle(title);
    setFormOpen(true);
  };

  const list = tab === "active" ? open : tab === "closed" ? closed : archived.data ?? [];
  const loading = tab === "archived" ? archived.isLoading : isLoading;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plan"
        title="Goals"
        description="What you're working toward this week, month and year."
        actions={
          <Button size="sm" onClick={() => create()}>
            <Plus className="size-4" /> New goal
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile isLoading={isLoading} icon={<Target className="size-3.5 text-primary" />} label="Active" value={open.filter((g) => g.status === "active").length} />
        <StatTile isLoading={isLoading} icon={<TrendingUp className="size-3.5 text-sky-500" />} label="On track" value={onTrack} hint="keeping up with the calendar" />
        <StatTile
          isLoading={isLoading}
          icon={<CircleAlert className="size-3.5 text-amber-500" />}
          label="Needs review"
          value={review.length}
          hint={review.length ? "deadline passed — decide what's next" : "Nothing to review"}
        />
        <StatTile isLoading={isLoading} icon={<Trophy className="size-3.5 text-emerald-500" />} label="Completed" value={completedThisYear} hint={`in ${thisYear}`} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="px-1">
        <TabsList>
          <TabsTrigger value="active" className="text-xs">In progress</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs">Finished</TabsTrigger>
          <TabsTrigger value="archived" className="gap-1.5 text-xs"><Archive className="size-3" /> Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />)}
        </div>
      ) : list.length === 0 ? (
        tab === "active" ? (
          <EmptyState
            icon={Flag}
            title="Set your first goal"
            description="Pick a time frame and a name — you can add steps, tasks and reminders later."
            action={
              <div className="flex flex-col items-center gap-3">
                <Button size="sm" onClick={() => create()}><Plus className="size-4" /> New goal</Button>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => create(e)}
                      className="cursor-pointer rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        ) : (
          <EmptyState
            icon={tab === "closed" ? Trophy : Archive}
            title={tab === "closed" ? "No finished goals yet" : "Nothing archived"}
            description={tab === "closed" ? "Completed and cancelled goals show up here." : "Archive goals you want out of the way but not deleted."}
          />
        )
      ) : tab === "active" ? (
        <div className="space-y-6">
          <Group title="Needs review" goals={review} tone="review" />
          {PERIOD_OPTIONS.map((p) => (
            <Group key={p.value} title={p.group} goals={open.filter((g) => !g.needsReview && g.period === p.value)} />
          ))}
        </div>
      ) : (
        <GoalGrid goals={[...list].sort((a, b) => (b.completedAt ?? b.endDate).localeCompare(a.completedAt ?? a.endDate))} />
      )}

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} initialTitle={initialTitle} />
    </div>
  );
}
