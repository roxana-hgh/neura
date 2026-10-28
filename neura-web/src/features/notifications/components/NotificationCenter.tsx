import { useState } from "react";
import { Link } from "react-router-dom";
import { addMinutes, format } from "date-fns";
import { Bell, BellRing, Check, CheckCheck, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useEnablePush, useNotificationInbox, usePushState,
} from "@/features/notifications/hooks/useNotifications";
import { dueLabel } from "@/features/notifications/lib/notificationText";
import type { InboxTask } from "@/features/notifications/types/notification";
import { useCompleteReminder, useSnoozeReminder } from "@/features/reminders/hooks/useReminders";
import { useToggleTask } from "@/features/tasks/hooks/useTasks";
import { PRIORITY_STYLES } from "@/features/tasks/utils/calendar";

const PUSH_CTA_KEY = "neura-push-cta-dismissed";
const PUSH_CTA_SNOOZE_DAYS = 14;

function ctaDismissed() {
  try {
    const at = Number(localStorage.getItem(PUSH_CTA_KEY));
    return Boolean(at) && Date.now() - at < PUSH_CTA_SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function SectionLabel({ children, tone }: { children: React.ReactNode; tone?: "danger" }) {
  return (
    <p className={cn(
      "px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
      tone === "danger" && "text-rose-600 dark:text-rose-400",
    )}>
      {children}
    </p>
  );
}

function TaskRow({ task, overdue, onDone }: { task: InboxTask; overdue?: boolean; onDone: () => void }) {
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/60">
      <button
        type="button"
        onClick={onDone}
        aria-label={`Complete ${task.title}`}
        className="flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-muted-foreground/40 text-transparent transition-colors hover:border-primary hover:text-primary"
      >
        <Check className="size-3" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
      {overdue && (
        <span className="shrink-0 text-xs text-rose-600 dark:text-rose-400">
          {format(new Date(task.dueDate), "MMM d")}
        </span>
      )}
      <span className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_STYLES[task.priority]?.dot)} />
    </div>
  );
}

/** Header bell: what needs attention now. Due reminders first, then today's and overdue tasks. */
function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [hideCta, setHideCta] = useState(ctaDismissed);
  const { data } = useNotificationInbox();
  const { data: push } = usePushState();
  const enablePush = useEnablePush();
  const completeReminder = useCompleteReminder();
  const snoozeReminder = useSnoozeReminder();
  const toggleTask = useToggleTask();

  const reminders = data?.reminders ?? [];
  const today = data?.tasks.today ?? [];
  const overdue = data?.tasks.overdue ?? [];
  const count = reminders.length + today.length + overdue.length;
  const urgent = reminders.length > 0;

  const showCta = push?.supported && !push.enabled && push.permission !== "denied" && !hideCta;

  const dismissCta = () => {
    try {
      localStorage.setItem(PUSH_CTA_KEY, String(Date.now()));
    } catch {
      // fine: hidden for this session only
    }
    setHideCta(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8" aria-label={`Notifications${count ? `, ${count} items` : ""}`}>
          {urgent ? <BellRing className="size-[18px]" /> : <Bell className="size-[18px]" />}
          {count > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white",
              urgent ? "bg-rose-500" : "bg-primary text-primary-foreground",
            )}>
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[22rem] max-w-[calc(100vw-1rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <Link to="/reminders" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
            All reminders
          </Link>
        </div>

        <div className="max-h-[min(26rem,65vh)] overflow-y-auto pb-2">
          {count === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCheck className="size-5" />
              </span>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Nothing due right now. Enjoy the calm.</p>
            </div>
          ) : (
            <>
              {reminders.length > 0 && (
                <>
                  <SectionLabel>Reminders</SectionLabel>
                  {reminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/60">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <BellRing className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{dueLabel(r.nextAt)}</p>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="size-7" title="Snooze 10 min"
                        onClick={() => snoozeReminder.mutate({ id: r.id, until: addMinutes(new Date(), 10) })}
                      >
                        <Clock className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="size-7 text-primary" title="Done"
                        onClick={() => completeReminder.mutate({ id: r.id })}
                      >
                        <Check className="size-4" />
                      </Button>
                    </div>
                  ))}
                </>
              )}

              {today.length > 0 && (
                <>
                  <SectionLabel>Due today</SectionLabel>
                  {today.map((t) => (
                    <TaskRow key={t.id} task={t} onDone={() => toggleTask.mutate({ id: t.id, completed: true })} />
                  ))}
                </>
              )}

              {overdue.length > 0 && (
                <>
                  <SectionLabel tone="danger">Overdue</SectionLabel>
                  {overdue.slice(0, 10).map((t) => (
                    <TaskRow key={t.id} task={t} overdue onDone={() => toggleTask.mutate({ id: t.id, completed: true })} />
                  ))}
                  {overdue.length > 10 && (
                    <Link to="/tasks" onClick={() => setOpen(false)} className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                      +{overdue.length - 10} more in Tasks
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {showCta && (
          <div className="flex items-start gap-3 border-t border-border bg-muted/40 px-3 py-3">
            <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Never miss a reminder</p>
              <p className="text-xs text-muted-foreground">Get notified even when Neura is closed.</p>
              <Button size="sm" className="mt-2 h-7" disabled={enablePush.isPending} onClick={() => enablePush.mutate()}>
                Turn on
              </Button>
            </div>
            <button type="button" onClick={dismissCta} aria-label="Not now" className="cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
