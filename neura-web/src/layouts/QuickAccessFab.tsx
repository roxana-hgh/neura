import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Check, CornerDownLeft, Lightbulb, ListTodo, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReminderCounts } from "@/features/reminders/hooks/useReminders";
import { useBrainstorms, useCreateBrainstorm } from "@/features/brainstorms/hooks/useBrainstorms";
import { isNew } from "@/features/brainstorms/lib/brainstormText";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { getTaskStats } from "@/features/tasks/utils/taskStats";
import { cn } from "@/lib/utils";

const CAPTURE_MAX = 5000;

/** Pages with their own bottom UI (chat input, editor toolbar) where the FAB would sit in the way */
const HIDDEN_ON = [/^\/assistant/, /^\/note\//, /^\/notes\/add/];

interface QuickAccessItem {
  to: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  iconClass: string;
}

/** Quick capture: Enter sends the thought to the Brainstorms inbox, Shift+Enter adds a line */
function QuickCapture({ autoFocus }: { autoFocus: boolean }) {
  const [text, setText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const create = useCreateBrainstorm();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const save = () => {
    const content = text.trim();
    if (!content) return;
    setText(""); // clear at once; put it back if saving fails
    create.mutate(content, {
      onSuccess: () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1400);
      },
      onError: () => setText(content),
    });
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-border bg-card p-3 shadow-md transition-shadow focus-within:border-primary/40 fill-mode-backwards animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <Lightbulb className="size-4" />
        </span>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              save();
            }
          }}
          rows={1}
          maxLength={CAPTURE_MAX}
          dir="auto"
          placeholder="Quick capture: an idea, a to-do…"
          aria-label="Quick capture to Brainstorms"
          className="field-sizing-content max-h-40 min-h-7 min-w-0 flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 pl-9.5">
        <p
          className={cn(
            "inline-flex items-center gap-1 text-[11px] transition-colors",
            savedFlash ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {savedFlash ? (
            <>
              <Check className="size-3" /> Saved to Brainstorms
            </>
          ) : (
            <>Goes to your Brainstorms inbox</>
          )}
        </p>
        <Button type="submit" size="sm" disabled={!text.trim()}>
          <span className="text-xs">Capture</span> <CornerDownLeft className="size-3.5" />
        </Button>
      </div>
    </form>
  );
}

/** Floating speed-dial (bottom-right) on every page: quick capture + shortcuts with live hints */
function QuickAccessFab() {
  const { pathname } = useLocation();
  // the page it was opened on: navigating anywhere (links, back button, search palette…) closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const { data: reminderCounts } = useReminderCounts();
  const { data: inbox } = useBrainstorms("inbox");
  const { data: tasks, isPending: tasksPending } = useTasks();
  const stats = useMemo(() => getTaskStats(tasks ?? []), [tasks]);

  // focus the capture box on open only with a mouse; on phones it would pop the keyboard over the menu
  const finePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  const tasksHint = tasksPending
    ? undefined
    : stats.overdue
      ? `${stats.overdue} overdue · ${stats.dueToday} due today`
      : `${stats.dueToday} due today · ${stats.open} open`;

  const remindersHint = reminderCounts
    ? reminderCounts.overdue
      ? `${reminderCounts.overdue} overdue`
      : reminderCounts.today
        ? `${reminderCounts.today} later today`
        : "Nothing due today"
    : undefined;

  const freshCount = inbox?.filter(isNew).length ?? 0;
  const brainstormsHint = inbox
    ? inbox.length
      ? `${inbox.length} in inbox${freshCount ? ` · ${freshCount} new` : ""}`
      : "Jot down a thought"
    : undefined;

  const items: QuickAccessItem[] = [
    {
      to: "/assistant",
      label: "Assistant",
      hint: "Plan or change things by chat",
      icon: <Sparkles className="size-4.5" />,
      iconClass: "bg-primary text-primary-foreground",
    },
    {
      to: "/brainstorms",
      label: "Brainstorms",
      hint: brainstormsHint,
      icon: <Lightbulb className="size-4.5" />,
      iconClass: "bg-violet-500 text-white",
    },
    {
      to: "/reminders",
      label: "Reminders",
      hint: remindersHint,
      icon: <Bell className="size-4.5" />,
      iconClass: "bg-amber-500 text-white",
    },
    {
      to: "/tasks",
      label: "Tasks",
      hint: tasksHint,
      icon: <ListTodo className="size-4.5" />,
      iconClass: "bg-sky-500 text-white",
    },
  ];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (HIDDEN_ON.some((re) => re.test(pathname))) return null;

  return (
    <>
      {/* click-away layer */}
      {open && (
        <button
          type="button"
          aria-label="Close quick access"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-150"
        />
      )}

      <div className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3">
        {open && (
          <div id="quick-access-menu" className="flex flex-col items-end gap-2.5">
            <QuickCapture autoFocus={finePointer} />
            <nav aria-label="Quick access" className="flex flex-col items-end gap-2.5">
              {items.map((item, i) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${(items.length - 1 - i) * 40}ms` }}
                  className="group flex items-center gap-3 fill-mode-backwards animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <span className="rounded-xl border border-border bg-card px-3 py-1.5 text-right shadow-md">
                    <span className="block text-sm font-medium">{item.label}</span>
                    {item.hint && <span className="block text-[11px] text-muted-foreground">{item.hint}</span>}
                  </span>
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-105",
                      item.iconClass,
                    )}
                  >
                    {item.icon}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        <button
          type="button"
          aria-label={open ? "Close quick access" : "Quick access"}
          aria-expanded={open}
          aria-controls="quick-access-menu"
          title="Quick access"
          onClick={() => setOpen(!open)}
          className="flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
        >
          <span className={cn("transition-transform duration-200", open && "rotate-90")}>
            {open ? <X className="size-6" /> : <Zap className="size-6" />}
          </span>
        </button>
      </div>
    </>
  );
}

export default QuickAccessFab;
