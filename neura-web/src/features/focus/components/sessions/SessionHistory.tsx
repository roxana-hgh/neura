/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import SessionFilters from "@/features/focus/components/sessions/SessionFilters";
import { useFocusTimerStore } from "@/features/focus/stores/focusTimerStore";
import { useDeleteFocusSession, useFocusSessions } from "@/features/focus/hooks/useFocusSessions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import SessionEditDialog from "@/features/focus/components/sessions/SessionEditDialog";
import type { FocusSession } from "@/features/focus/types/focusSession";
import AlertDialog from "@/components/shared/AlertDialog";
import { LucideTimer } from "lucide-react";
import SessionCard from "@/features/focus/components/sessions/SessionCard";

const PAGE_SIZE = 12;

function SessionHistory() {
  const range = useFocusTimerStore((s) => s.historyRange);
  const setRange = useFocusTimerStore((s) => s.setHistoryRange);
  const tag = useFocusTimerStore((s) => s.historyTag);
  const setTag = useFocusTimerStore((s) => s.setHistoryTag);

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FocusSession[]>([]);
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = () => {
    const id = deletingId;
    if (!id) return;
    deleteSession(id, {
      onSuccess: () => {
        toast.success("Session deleted");
        setItems((prev) => prev.filter((s) => s.id !== id));
      },
      onError: () => toast.error("Couldn't delete the session"),
    });
  };

  return (
    <section className="rounded-3xl border bg-card/50 p-4 md:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">History</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {data?.total ?? 0} {data?.total === 1 ? "session" : "sessions"}
        </span>
      </div>

      <SessionFilters range={range} onRangeChange={setRange} tag={tag} onTagChange={setTag} />

      {isLoading && items.length === 0 ? (
        <div className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LucideTimer size={20} />
          </div>
          <p className="text-sm font-medium text-foreground">No sessions yet</p>
          <p className="text-xs text-muted-foreground">Finish a focus session and it will show up here.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={() => setEditingSession(session)}
                onDelete={() => setDeletingId(session.id)}
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
      <AlertDialog
        open={deletingId !== null}
        setOpen={(open) => !open && setDeletingId(null)}
        title="Delete session?"
        description="This focus session will be removed from your history."
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={handleDelete}
      />
    </section>
  );
}

export default SessionHistory;