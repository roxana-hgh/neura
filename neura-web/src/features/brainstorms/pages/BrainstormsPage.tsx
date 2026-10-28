import { useEffect, useMemo, useRef, useState } from "react";
import { startOfWeek } from "date-fns";
import { Archive, CalendarRange, ChevronDown, Inbox, Lightbulb, RotateCcw, Search, Sparkles, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AlertDialog from "@/components/shared/AlertDialog";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import StatTile from "@/components/shared/StatTile";
import { useWeekStartsOn } from "@/hooks/useWeekStartsOn";
import { BrainstormCapture } from "@/features/brainstorms/components/BrainstormCapture";
import { BrainstormConvertDialogs, type ConvertTarget } from "@/features/brainstorms/components/BrainstormConvertDialogs";
import { BrainstormItem } from "@/features/brainstorms/components/BrainstormItem";
import { BrainstormReview } from "@/features/brainstorms/components/BrainstormReview";
import {
  useBrainstorms, useClearProcessed, useDeleteBrainstorm, useProcessBrainstorm, useRestoreBrainstorm,
} from "@/features/brainstorms/hooks/useBrainstorms";
import { groupByCaptureDay, isNew, matchesSearch, reviewQueue, timeAgo } from "@/features/brainstorms/lib/brainstormText";
import type { Brainstorm, ReviewMode } from "@/features/brainstorms/types/brainstorm";
import { toast } from "@/lib/toast";

type Tab = "inbox" | "processed";

function ListSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3 px-2 py-3">
          <div className="mt-1.5 size-2 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrainstormsPage() {
  const weekStartsOn = useWeekStartsOn();
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<Tab>("inbox");
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<{ mode: ReviewMode; items: Brainstorm[] } | null>(null);
  const [convert, setConvert] = useState<ConvertTarget | null>(null);
  const [toDelete, setToDelete] = useState<Brainstorm | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const inbox = useBrainstorms("inbox");
  const processed = useBrainstorms("processed");
  const process = useProcessBrainstorm();
  const restore = useRestoreBrainstorm();
  const remove = useDeleteBrainstorm();
  const clearProcessed = useClearProcessed();

  const inboxItems = useMemo(() => inbox.data ?? [], [inbox.data]);
  const processedItems = useMemo(() => processed.data ?? [], [processed.data]);

  const stats = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn });
    const thisWeek = processedItems.filter((b) => b.processedAt && new Date(b.processedAt) >= weekStart);
    const lastReset = [...inboxItems, ...processedItems]
      .map((b) => b.reviewedAt)
      .filter((d): d is string => !!d)
      .sort()
      .at(-1);
    return {
      fresh: inboxItems.filter(isNew).length,
      sortedThisWeek: thisWeek.length,
      tasks: thisWeek.filter((b) => b.convertedTo === "task").length,
      reminders: thisWeek.filter((b) => b.convertedTo === "reminder").length,
      lastReset,
    };
  }, [inboxItems, processedItems, weekStartsOn]);

  // "N" jumps to the capture box from anywhere on the page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey || review) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      captureRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [review]);

  const startReview = (mode: ReviewMode) => {
    const items = reviewQueue(inboxItems, mode);
    if (!items.length) {
      toast.default(mode === "daily" ? "Nothing new since your last reset" : "Your inbox is empty");
      return;
    }
    setReview({ mode, items });
  };

  const dismiss = (item: Brainstorm) =>
    process.mutate({ id: item.id }, {
      onSuccess: () => toast.default("Let go", { action: { label: "Undo", onClick: () => restore.mutate(item.id) } }),
    });

  const restoreItem = (item: Brainstorm) =>
    restore.mutate(item.id, { onSuccess: () => toast.success("Back in your inbox") });

  const list = tab === "inbox" ? inboxItems : processedItems;
  const filtered = list.filter((b) => matchesSearch(b, search));
  const groups = tab === "inbox" ? groupByCaptureDay(filtered, weekStartsOn) : [{ label: "", items: filtered }];
  const isLoading = tab === "inbox" ? inbox.isLoading : processed.isLoading;

  const itemProps = {
    onConvert: (item: Brainstorm, kind: ConvertTarget["kind"]) => setConvert({ item, kind }),
    onDismiss: dismiss,
    onRestore: restoreItem,
    onDelete: setToDelete,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Clear your mind"
        title="Brainstorms"
        description="Your brain is for having ideas, not holding them. Jot anything down, then sort it in your daily or weekly reset."
        actions={
          !review && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Sparkles className="size-4" /> Start reset <ChevronDown className="size-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onSelect={() => startReview("daily")} className="items-start gap-3 py-2">
                  <Sun className="mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Daily reset</p>
                    <p className="text-xs text-muted-foreground">Sort what's new since last time</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{stats.fresh}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => startReview("weekly")} className="items-start gap-3 py-2">
                  <CalendarRange className="mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Weekly reset</p>
                    <p className="text-xs text-muted-foreground">Go through the whole inbox</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{inboxItems.length}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          isLoading={inbox.isLoading}
          icon={<Inbox className="size-3.5 text-primary" />}
          label="In inbox"
          value={inboxItems.length}
          hint={inboxItems.length ? "waiting to be sorted" : "Clear"}
        />
        <StatTile
          isLoading={inbox.isLoading}
          icon={<Lightbulb className="size-3.5 text-amber-500" />}
          label="New"
          value={stats.fresh}
          hint={stats.lastReset ? `Last reset ${timeAgo(stats.lastReset)}` : "No reset yet"}
        />
        <StatTile
          isLoading={processed.isLoading}
          icon={<Archive className="size-3.5 text-emerald-500" />}
          label="Sorted this week"
          value={stats.sortedThisWeek}
          hint={stats.sortedThisWeek ? `${stats.tasks} tasks · ${stats.reminders} reminders` : undefined}
        />
      </div>

      {review ? (
        <BrainstormReview key={review.mode} mode={review.mode} items={review.items} onExit={() => setReview(null)} />
      ) : (
        <>
          <BrainstormCapture ref={captureRef} />

          {stats.fresh >= 5 && tab === "inbox" && !search && (
            <button
              type="button"
              onClick={() => startReview("daily")}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition hover:bg-primary/10"
            >
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span className="flex-1 text-sm">
                <span className="font-medium">{stats.fresh} new thoughts</span>
                <span className="text-muted-foreground"> are piling up. A quick daily reset takes a couple of minutes.</span>
              </span>
              <span className="text-xs font-medium text-primary">Start</span>
            </button>
          )}

          <section className="rounded-xl border border-border bg-card p-2 sm:p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
                <TabsList>
                  <TabsTrigger value="inbox" className="gap-1.5 text-xs">
                    Inbox
                    {!!inboxItems.length && (
                      <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{inboxItems.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="processed" className="text-xs">Sorted</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-1.5">
                {list.length > 0 && (
                  <label className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2 focus-within:border-ring dark:bg-input/30">
                    <Search className="size-3.5 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      aria-label="Search brainstorms"
                      className="w-28 bg-transparent text-xs outline-none placeholder:text-muted-foreground sm:w-40"
                    />
                  </label>
                )}
                {tab === "processed" && processedItems.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmClear(true)}>
                    <Trash2 className="size-3.5" /> <span className="hidden sm:inline">Clear history</span>
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <ListSkeleton />
            ) : filtered.length === 0 ? (
              search ? (
                <EmptyState compact icon={Search} title="No matches" description={`Nothing contains "${search}".`} />
              ) : tab === "inbox" ? (
                <EmptyState
                  compact
                  icon={Lightbulb}
                  title="Your mind is clear"
                  description="Whenever something pops into your head, drop it in the box above."
                  action={
                    <Button size="sm" variant="outline" onClick={() => captureRef.current?.focus()}>
                      Capture a thought
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  compact
                  icon={RotateCcw}
                  title="Nothing sorted yet"
                  description="Thoughts you turn into tasks or reminders, or let go of, show up here."
                />
              )
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.label || "all"}>
                    {group.label && (
                      <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {group.label} <span className="font-normal tabular-nums">· {group.items.length}</span>
                      </p>
                    )}
                    <div className="divide-y divide-border/60">
                      {group.items.map((item) => (
                        <BrainstormItem key={item.id} item={item} {...itemProps} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <BrainstormConvertDialogs target={convert} onClose={() => setConvert(null)} />

      <AlertDialog
        open={!!toDelete}
        setOpen={(open) => !open && setToDelete(null)}
        title="Delete this thought?"
        description="It will be removed for good. Tasks or reminders made from it stay."
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => toast.success("Deleted") })}
      />

      <AlertDialog
        open={confirmClear}
        setOpen={setConfirmClear}
        title="Clear sorted history?"
        description="Removes every sorted thought from this list. The tasks and reminders you made stay."
        acceptButtonText="Clear"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={() =>
          clearProcessed.mutate(undefined, {
            onSuccess: ({ deleted }) => toast.success(`Cleared ${deleted} item${deleted === 1 ? "" : "s"}`),
          })
        }
      />
    </div>
  );
}
