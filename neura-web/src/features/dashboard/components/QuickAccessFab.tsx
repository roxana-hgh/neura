import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, Lightbulb, ListTodo, Sparkles, X, Zap } from "lucide-react";
import { useReminderCounts } from "@/features/reminders/hooks/useReminders";
import { useBrainstorms } from "@/features/brainstorms/hooks/useBrainstorms";
import { isNew } from "@/features/brainstorms/lib/brainstormText";
import { cn } from "@/lib/utils";

interface QuickAccessItem {
  to: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  iconClass: string;
}

interface QuickAccessFabProps {
  /** Short status under the Tasks label, e.g. "3 due today" */
  tasksHint?: string;
}

/** Floating speed-dial (bottom-right), same look as the Notes "new note" button */
function QuickAccessFab({ tasksHint }: QuickAccessFabProps) {
  const [open, setOpen] = useState(false);
  const { data: reminderCounts } = useReminderCounts();
  const { data: inbox } = useBrainstorms("inbox");

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
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
          <nav id="quick-access-menu" aria-label="Quick access" className="flex flex-col items-end gap-2.5">
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
        )}

        <button
          type="button"
          aria-label={open ? "Close quick access" : "Quick access"}
          aria-expanded={open}
          aria-controls="quick-access-menu"
          title="Quick access"
          onClick={() => setOpen((o) => !o)}
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
