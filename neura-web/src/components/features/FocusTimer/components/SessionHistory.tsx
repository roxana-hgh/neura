/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import SessionFilters from "./SessionFilters";
import { useFocusTimerStore } from "../stores/focusTimerStore";
import { useDeleteFocusSession, useFocusSessions } from "../hooks/useFocusSessions";
import { toast } from "../../../../lib/toast";
import { Button } from "../../../ui/button";
import SessionEditDialog from "./SessionEditDialog";
import type { FocusSession } from "../../../../types/FocusSession";

import LifetimeSummary from "./LifetimeSummary";
import SessionCard from "./SessionCard";

const PAGE_SIZE = 12;

function SessionHistory() {
  const range = useFocusTimerStore((s) => s.historyRange);
  const setRange = useFocusTimerStore((s) => s.setHistoryRange);
  const tag = useFocusTimerStore((s) => s.historyTag);
  const setTag = useFocusTimerStore((s) => s.setHistoryTag);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FocusSession[]>([]);
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);

  const { data, isLoading, isFetching } = useFocusSessions(range, tag === "all" ? undefined : tag, page, PAGE_SIZE);
  const { mutate: deleteSession } = useDeleteFocusSession();

  // Reset pagination whenever the filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [range, tag]);

  // Merge pages, de-duped by id (covers refetches after create/update/delete)
  useEffect(() => {
    if (!data) return;
    setItems((prev) => {
      const base = page === 1 ? [] : prev;
      const merged = [...base, ...data.sessions];
      const seen = new Set<string>();
      return merged.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
    });
  }, [data, page]);

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this focus session?")) {
      deleteSession(id, {
        onSuccess: () => {
          toast.success("Session deleted");
          setItems((prev) => prev.filter((s) => s.id !== id));
        },
        onError: () => toast.error("Couldn't delete the session"),
      });
    }
  };

  return (
     <div className="rounded-2xl border border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/[0.03] p-4 md:p-6">
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-lg font-bold text-stone-900 dark:text-white">History Stream</h2>
      <span className="text-xs font-medium tracking-wide text-stone-400 dark:text-neutral-500 uppercase">
        {data?.total ?? 0} {data?.total === 1 ? "Snapshot" : "Snapshots"}
      </span>
    </div>

    <SessionFilters range={range} onRangeChange={setRange} tag={tag} onTagChange={setTag} />
    <LifetimeSummary />

      {isLoading && items.length === 0 ? (
         <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />
        ))}
      </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-sm text-stone-500 dark:text-neutral-500">
        No focus sessions for this period.
      </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {items.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => setEditingSession(session)}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>

          {data?.hasMore && (
            <div className="mt-5 flex justify-center">
              <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setPage((p) => p + 1)}>
                {isFetching ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}

      <SessionEditDialog session={editingSession} onClose={() => setEditingSession(null)} />
    </div>
  );
}

export default SessionHistory;