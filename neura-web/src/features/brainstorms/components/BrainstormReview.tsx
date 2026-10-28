import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive, ArrowLeft, ArrowRight, Bell, Check, CircleCheckBig, Pencil, PartyPopper, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AlertDialog from "@/components/shared/AlertDialog";
import { BrainstormConvertDialogs, type ConvertTarget } from "@/features/brainstorms/components/BrainstormConvertDialogs";
import { BrainstormEditor } from "@/features/brainstorms/components/BrainstormEditor";
import {
  useDeleteBrainstorm, useKeepBrainstorm, useProcessBrainstorm,
} from "@/features/brainstorms/hooks/useBrainstorms";
import { exactTime, isNew, timeAgo } from "@/features/brainstorms/lib/brainstormText";
import type { Brainstorm, ReviewMode } from "@/features/brainstorms/types/brainstorm";
import { cn } from "@/lib/utils";

type Outcome = "task" | "reminder" | "kept" | "done" | "deleted";

interface BrainstormReviewProps {
  mode: ReviewMode;
  /** The inbox when the review started; the queue doesn't change while reviewing */
  items: Brainstorm[];
  onExit: () => void;
}

const MODE_LABEL: Record<ReviewMode, string> = { daily: "Daily reset", weekly: "Weekly reset" };

// Ignore shortcuts while typing or while a dialog is open
function shouldIgnoreShortcut(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return true;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"]');
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded border border-border bg-muted px-1 font-sans text-[10px] text-muted-foreground sm:inline">
      {children}
    </kbd>
  );
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  hint: string;
  shortcut: string;
  onClick: () => void;
  className?: string;
}

function ActionButton({ icon, label, hint, shortcut, onClick, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/action flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition group-hover/action:bg-primary group-hover/action:text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <Kbd>{shortcut}</Kbd>
    </button>
  );
}

/**
 * The reset: one thought at a time, each one decided — task, reminder, keep for later,
 * or let go. Keyboard: T / R / K / D, ← → to move, Delete to remove, E to edit.
 */
export function BrainstormReview({ mode, items, onExit }: BrainstormReviewProps) {
  // snapshot, oldest first, so the queue stays stable while items leave the inbox
  const [queue, setQueue] = useState(() =>
    [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [convert, setConvert] = useState<ConvertTarget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const keep = useKeepBrainstorm();
  const process = useProcessBrainstorm();
  const remove = useDeleteBrainstorm();

  const handled = Object.keys(outcomes).length;
  const finished = handled === queue.length;
  const current = finished ? null : queue[index];

  /** Next undecided item after `from`, wrapping around */
  const nextOpen = useCallback(
    (from: number, decided: Record<string, Outcome>) => {
      for (let step = 1; step <= queue.length; step++) {
        const i = (from + step) % queue.length;
        if (!decided[queue[i].id]) return i;
      }
      return from;
    },
    [queue],
  );

  const decide = useCallback(
    (outcome: Outcome) => {
      if (!current) return;
      const next = { ...outcomes, [current.id]: outcome };
      setOutcomes(next);
      setEditing(false);
      setIndex(nextOpen(index, next));
    },
    [current, outcomes, index, nextOpen],
  );

  const move = useCallback(
    (dir: 1 | -1) => {
      if (queue.length < 2) return;
      setEditing(false);
      let i = index;
      for (let step = 0; step < queue.length; step++) {
        i = (i + dir + queue.length) % queue.length;
        if (!outcomes[queue[i].id]) break;
      }
      setIndex(i);
    },
    [index, outcomes, queue],
  );

  const actions = useMemo(() => {
    if (!current) return null;
    return {
      task: () => setConvert({ item: current, kind: "task" }),
      reminder: () => setConvert({ item: current, kind: "reminder" }),
      keep: () => {
        keep.mutate(current.id);
        decide("kept");
      },
      done: () => {
        process.mutate({ id: current.id });
        decide("done");
      },
    };
  }, [current, keep, process, decide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreShortcut(e) || !actions || editing) return;
      const key = e.key.toLowerCase();
      const map: Record<string, () => void> = {
        t: actions.task,
        r: actions.reminder,
        k: actions.keep,
        d: actions.done,
        e: () => setEditing(true),
        arrowright: () => move(1),
        arrowleft: () => move(-1),
        delete: () => setConfirmDelete(true),
        backspace: () => setConfirmDelete(true),
      };
      if (map[key]) {
        e.preventDefault();
        map[key]();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, editing, move]);

  const tally = useMemo(() => {
    const t: Record<Outcome, number> = { task: 0, reminder: 0, kept: 0, done: 0, deleted: 0 };
    Object.values(outcomes).forEach((o) => t[o]++);
    return t;
  }, [outcomes]);

  const progress = queue.length ? Math.round((handled / queue.length) * 100) : 100;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{MODE_LABEL[mode]}</p>
          <p className="text-sm font-medium tabular-nums">
            {finished ? "All sorted" : `${handled + 1} of ${queue.length}`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          {finished ? "Close" : <><X className="size-4" /> End review</>}
        </Button>
      </div>
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {finished ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold">Mind cleared</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You went through {queue.length} {queue.length === 1 ? "thought" : "thoughts"}. Nothing left to hold on to.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 text-xs">
            {tally.task > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{tally.task} → tasks</span>}
            {tally.reminder > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">{tally.reminder} → reminders</span>
            )}
            {tally.kept > 0 && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{tally.kept} kept for later</span>}
            {tally.done > 0 && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{tally.done} let go</span>}
            {tally.deleted > 0 && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{tally.deleted} deleted</span>}
          </div>
          <Button size="sm" onClick={onExit}>Back to inbox</Button>
        </div>
      ) : current && actions && (
        <div className="space-y-4 p-4 sm:p-6">
          {/* the thought */}
          <div className="relative rounded-xl border border-border bg-background p-4 sm:p-5">
            {editing ? (
              <BrainstormEditor
                item={current}
                className="text-base"
                onDone={(content) => {
                  if (content) setQueue((q) => q.map((b) => (b.id === current.id ? { ...b, content } : b)));
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <p dir="auto" className="whitespace-pre-wrap break-words pr-8 text-base leading-relaxed sm:text-lg">
                  {current.content}
                </p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-3 right-3 text-muted-foreground"
                  onClick={() => setEditing(true)}
                  aria-label="Edit"
                  title="Edit (E)"
                >
                  <Pencil />
                </Button>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span title={exactTime(current.createdAt)}>Captured {timeAgo(current.createdAt)}</span>
                  {isNew(current) && <span className="rounded-full bg-primary/10 px-1.5 font-medium text-primary">New</span>}
                </div>
              </>
            )}
          </div>

          {/* decisions */}
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton icon={<CircleCheckBig className="size-4" />} label="Make it a task" hint="Pick a title, list, priority and due date" shortcut="T" onClick={actions.task} />
            <ActionButton icon={<Bell className="size-4" />} label="Set a reminder" hint="Get back to it at a certain time" shortcut="R" onClick={actions.reminder} />
            <ActionButton icon={<Archive className="size-4" />} label="Keep for later" hint="Stays in the inbox, not new anymore" shortcut="K" onClick={actions.keep} />
            <ActionButton icon={<Check className="size-4" />} label="Done, let it go" hint="Handled or no longer needed" shortcut="D" onClick={actions.done} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => move(-1)} disabled={queue.length - handled < 2}>
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => move(1)} disabled={queue.length - handled < 2}>
              <span className="hidden sm:inline">Skip</span> <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <BrainstormConvertDialogs
        target={convert}
        onClose={() => setConvert(null)}
        onConverted={({ kind }) => decide(kind)}
      />

      <AlertDialog
        open={confirmDelete}
        setOpen={setConfirmDelete}
        title="Delete this thought?"
        description="It will be removed for good."
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        onConfirm={() => {
          if (!current) return;
          remove.mutate(current.id);
          decide("deleted");
        }}
      />
    </section>
  );
}
