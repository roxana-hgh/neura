import { Link } from "react-router-dom";
import {
  AlarmClockOff, BellRing, Check, Clock, MoreHorizontal, Pause, Pencil, Play, Repeat, SkipForward, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LINK_ICONS } from "@/features/reminders/lib/linkIcons";
import {
  useCompleteReminder, useDeleteReminder, useReopenReminder, useSetReminderPaused, useSnoozeReminder,
} from "@/features/reminders/hooks/useReminders";
import { describeRepeat, formatWhen, isOverdue, snoozePresets } from "@/features/reminders/lib/reminderTime";
import type { Reminder } from "@/features/reminders/types/reminder";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ReminderItemProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  /** Row from the "Done" tab */
  done?: boolean;
  /** Hide the link chip (e.g. when listed inside the linked goal) */
  hideLink?: boolean;
}

function LinkChip({ reminder }: { reminder: Reminder }) {
  const link = reminder.goal
    ? { type: "goal" as const, title: reminder.goal.title, to: `/goal/${reminder.goal.parentId ?? reminder.goal.id}` }
    : reminder.task
      ? { type: "task" as const, title: reminder.task.title, to: "/tasks" }
      : reminder.note
        ? { type: "note" as const, title: reminder.note.title || "Untitled", to: `/note/${reminder.note.id}` }
        : null;
  if (!link) return null;
  const Icon = LINK_ICONS[link.type];
  return (
    <Link
      to={link.to}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-44 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{link.title}</span>
    </Link>
  );
}

export function ReminderItem({ reminder: r, onEdit, done = false, hideLink = false }: ReminderItemProps) {
  const complete = useCompleteReminder();
  const reopen = useReopenReminder();
  const snooze = useSnoozeReminder();
  const setPaused = useSetReminderPaused();
  const remove = useDeleteReminder();

  const repeats = r.repeat !== "none";
  const paused = r.status === "paused";
  const overdue = !done && isOverdue(r);
  const snoozed = !done && !!r.snoozedUntil && new Date(r.snoozedUntil) > new Date();
  const repeatText = describeRepeat(r);

  const markDone = () =>
    complete.mutate({ id: r.id }, {
      onSuccess: (updated) => {
        if (updated.status === "completed") {
          toast.default("Reminder done", { action: { label: "Undo", onClick: () => reopen.mutate(r.id) } });
        } else {
          toast.default(`Done · next ${formatWhen(updated.nextAt)}`);
        }
      },
    });

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40 sm:px-3",
        paused && "opacity-60",
      )}
    >
      {done ? (
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : paused ? (
        <button
          type="button"
          onClick={() => setPaused.mutate({ id: r.id, paused: false })}
          className="mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary"
          aria-label={`Resume "${r.title}"`}
          title="Resume"
        >
          <Play className="size-2.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={markDone}
          className={cn(
            "group/check mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition",
            overdue ? "border-rose-500" : "border-muted-foreground/40 hover:border-primary",
          )}
          aria-label={`Mark "${r.title}" as done`}
          title={repeats ? "Done for this time" : "Done"}
        >
          <Check className="size-3 text-primary opacity-0 transition group-hover/check:opacity-100" strokeWidth={3} />
        </button>
      )}

      <button type="button" onClick={() => onEdit(r)} className="min-w-0 flex-1 cursor-pointer text-left">
        <p className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{r.title}</p>
        {r.description && !done && <p className="truncate text-xs text-muted-foreground">{r.description}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1 tabular-nums", overdue && "font-medium text-rose-600 dark:text-rose-400")}>
            {snoozed ? <BellRing className="size-3" /> : <Clock className="size-3" />}
            {done
              ? `Done ${formatWhen(r.doneAt!)}`
              : snoozed
                ? `Snoozed to ${formatWhen(r.snoozedUntil!)}`
                : formatWhen(r.nextAt)}
          </span>
          {repeatText && (
            <span className="inline-flex items-center gap-1"><Repeat className="size-3" />{repeatText}</span>
          )}
          {paused && (
            <span className="inline-flex items-center gap-1">
              <AlarmClockOff className="size-3" />{r.suspendedBy === "goal" ? "Paused with its goal" : "Paused"}
            </span>
          )}
          {!hideLink && <LinkChip reminder={r} />}
        </div>
      </button>

      {!done && (
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          {!paused && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Snooze" title="Snooze" className="text-muted-foreground">
                  <BellRing className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Snooze until</DropdownMenuLabel>
                {snoozePresets().map((p) => (
                  <DropdownMenuItem
                    key={p.label}
                    onSelect={() => snooze.mutate({ id: r.id, until: p.at() }, {
                      onSuccess: (u) => toast.default(`Snoozed to ${formatWhen(u.nextAt)}`),
                    })}
                  >
                    {p.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onEdit(r)}>Pick a new time…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions" className="text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onSelect={() => onEdit(r)}><Pencil /> Edit</DropdownMenuItem>
              {repeats && !paused && (
                <>
                  <DropdownMenuItem onSelect={() => complete.mutate({ id: r.id, skip: true })}>
                    <SkipForward /> Skip this time
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => complete.mutate({ id: r.id, scope: "series" }, {
                    onSuccess: () => toast.default("Series ended", { action: { label: "Undo", onClick: () => reopen.mutate(r.id) } }),
                  })}>
                    <Check /> End series
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onSelect={() => setPaused.mutate({ id: r.id, paused: !paused })}>
                {paused ? <><Play /> Resume</> : <><Pause /> Pause</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => remove.mutate(r.id, { onSuccess: () => toast.success("Reminder deleted") })}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
