import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { ElementType } from "react";
import type { AssistantMode } from "@/features/assistant/hooks/useAssistant";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  CalendarCheck,
  CalendarRange,
  AlarmClock,
  BellPlus,
  ClipboardCheck,
  Target,
  Flame,
  Lightbulb,
  Sunset,
  Plus,
  ListPlus,
  ListTree,
  Pencil,
  Trophy,
  Waypoints,
} from "lucide-react";

interface QuickActionsProps {
  onAsk: (mode: AssistantMode, message: string) => void;
  onCompose: (draft: string) => void;
  disabled?: boolean;
  /** "grid": cards for the empty state · "chips": compact scrollable row above the input */
  variant?: "grid" | "chips";
}

interface AskAction {
  id: string;
  mode: AssistantMode;
  message: string; // shown as the user's bubble
  label: string;
  hint: string;
  icon: ElementType;
}

const ASK_ACTIONS: AskAction[] = [
  { id: "plan_day", mode: "plan_day", message: "Help me plan my day", label: "Plan my day", hint: "Tasks + habits in a smart order", icon: CalendarCheck },
  { id: "next_up", mode: "next_up", message: "What should I start with right now?", label: "What's next?", hint: "One clear thing to do now", icon: Target },
  { id: "reschedule_overdue", mode: "reschedule_overdue", message: "Help me catch up on overdue tasks", label: "Catch up on overdue", hint: "I'll suggest new dates", icon: AlarmClock },
  { id: "plan_week", mode: "plan_week", message: "How does my week look?", label: "Plan my week", hint: "See what's heavy or light", icon: CalendarRange },
  { id: "habit_checkin", mode: "habit_checkin", message: "How are my habits going?", label: "Habit check-in", hint: "Streaks at risk today", icon: Flame },
  { id: "wrap_up", mode: "wrap_up", message: "Let's wrap up my day", label: "Wrap up my day", hint: "Review and move leftovers", icon: Sunset },
  { id: "weekly_review", mode: "weekly_review", message: "Let's do my weekly review", label: "Weekly review", hint: "An honest look at your week", icon: ClipboardCheck },
  { id: "goal_coach", mode: "goal_coach", message: "Coach me on my goals", label: "Goal coach", hint: "What needs attention, next steps", icon: Trophy },
  { id: "sort_brainstorms", mode: "sort_brainstorms", message: "Help me sort my brainstorm inbox", label: "Sort my ideas", hint: "A verdict for every idea", icon: Lightbulb },
  { id: "connect_dots", mode: "connect_dots", message: "Connect the dots for me", label: "Connect the dots", hint: "Links and blind spots across Neura", icon: Waypoints },
];

const COMPOSE_ACTIONS: { draft: string; label: string; icon: ElementType }[] = [
  { draft: "Add a task: ", label: "Quick add", icon: Plus },
  { draft: "Add these tasks:\n- ", label: "Brain dump", icon: ListPlus },
  { draft: "Break this down into subtasks: /", label: "Break down", icon: ListTree },
  { draft: "Remind me to ", label: "Remind me", icon: BellPlus },
  { draft: "Help me turn this into a goal with sub-goals: ", label: "Shape a goal", icon: Target },
  { draft: "Edit /", label: "Edit something", icon: Pencil }, // "/" immediately opens the picker
];

// Put the most relevant action first for the time of day
function orderByTimeOfDay(actions: AskAction[]) {
  const hour = new Date().getHours();
  const firstId = hour >= 17 ? "wrap_up" : hour < 12 ? "plan_day" : "next_up";
  const first = actions.find((a) => a.id === firstId);
  return first ? [first, ...actions.filter((a) => a.id !== firstId)] : actions;
}

const DRAG_THRESHOLD = 6;
const CHIP_CLASS = "h-8 shrink-0 rounded-full bg-muted/60 px-3 text-xs font-normal text-muted-foreground hover:bg-accent hover:text-accent-foreground";

export function QuickActions({ onAsk, onCompose, disabled, variant = "grid" }: QuickActionsProps) {
  const asks = useMemo(() => orderByTimeOfDay(ASK_ACTIONS), []);
  const isChips = variant === "chips";

  // ---- drag-to-scroll (chips variant only) ----
  const scrollRef = useRef<HTMLDivElement>(null);
  const [moreOnRight, setMoreOnRight] = useState(false);
  const pointerId = useRef<number | null>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setMoreOnRight(hasOverflow && !atEnd);
  }, []);

useEffect(() => {
  if (!isChips) return;
  const el = scrollRef.current;
  if (!el) return;

  el.addEventListener("scroll", checkOverflow, { passive: true });
  const ro = new ResizeObserver(checkOverflow); // fires once on observe() → initial check
  ro.observe(el);

  return () => {
    el.removeEventListener("scroll", checkOverflow);
    ro.disconnect();
  };
}, [isChips, checkOverflow]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || pointerId.current === null) return;
    const delta = e.clientX - startX.current;
    if (!isDragging.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      didDrag.current = true;
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = startScrollLeft.current - delta;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (isDragging.current && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    isDragging.current = false;
    pointerId.current = null;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  };

  // ---------------- grid variant ----------------
  if (!isChips) {
    return (
      <div className="w-full max-w-2xl space-y-5">
        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
          {asks.map(({ id, mode, message, label, hint, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onAsk(mode, message)}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-50"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span className="min-w-0">
                <span className="block text-sm text-foreground">{label}</span>
                <span className="hidden truncate text-xs text-muted-foreground sm:block">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {COMPOSE_ACTIONS.map(({ draft, label, icon: Icon }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onCompose(draft)}
              className={CHIP_CLASS}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- chips variant ----------------
  return (
    <div
      ref={scrollRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={handleClickCapture}
      className={cn(
        "no-scrollbar flex cursor-grab select-none flex-nowrap justify-start gap-1.5 overflow-x-auto active:cursor-grabbing",
        moreOnRight && "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]"
      )}
      style={{ touchAction: "pan-x" }}
    >
        {asks.map(({ id, mode, message, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onAsk(mode, message)}
            className={CHIP_CLASS}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
        {COMPOSE_ACTIONS.map(({ draft, label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onCompose(draft)}
            className={CHIP_CLASS}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
    </div>
  );
}