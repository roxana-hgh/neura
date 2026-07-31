import { useRef, useState, useEffect, useCallback } from "react";
import type { AssistantMode } from "../hooks/Useassistant";
import { Button } from "../../../ui/button";

import {
  CalendarDays,
  ListChecks,
  AlarmClock,
  Flag,
  CheckCircle2,
  PlusCircle,
  Pencil,
  ChevronRight,
} from "lucide-react";


interface QuickActionsProps {
  onAsk: (mode: AssistantMode, message: string) => void;
  onCompose: (draft: string) => void;
  disabled?: boolean;
  onInputTop?: boolean;
}

const ASK_ACTIONS: {
  mode: AssistantMode;
  message: string;
  label: string;
  icon: React.ElementType;
}[] = [
  { mode: "today", message: "What are today's priorities?", label: "Today's priorities", icon: ListChecks },
  { mode: "week", message: "What's coming up this week?", label: "This week", icon: CalendarDays },
  { mode: "overdue", message: "Do I have anything overdue?", label: "Overdue", icon: AlarmClock },
  { mode: "custom", message: "What are my high priority tasks?", label: "High priority", icon: Flag },
  { mode: "custom", message: "What have I completed today?", label: "Completed today", icon: CheckCircle2 },
];

const COMPOSE_ACTIONS: {
  draft: string;
  label: string;
  icon: React.ElementType;
}[] = [
  { draft: "Add a task: ", label: "Add a task", icon: PlusCircle },
  { draft: "Edit ", label: "Edit a task", icon: Pencil },
];

const DRAG_THRESHOLD = 6; // px of movement before we treat it as a drag, not a click

export function QuickActions({ onAsk, onCompose, disabled, onInputTop = false }: QuickActionsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showChevron, setShowChevron] = useState(false);

  // --- drag-to-scroll state (refs, not state, so we don't re-render mid-drag) ---
  const pointerId = useRef<number | null>(null);
  const isDragging = useRef(false); // true only once threshold is crossed
  const didDrag = useRef(false); // used to suppress the click that follows a real drag
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setShowChevron(hasOverflow && !atEnd);
  }, []);

  useEffect(() => {
    if (!onInputTop) return;
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkOverflow, { passive: true });
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkOverflow);
      resizeObserver.disconnect();
    };
  }, [onInputTop, checkOverflow]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onInputTop) return;
    // Don't capture yet — just remember where we started.
    // Capture only happens once we confirm this is a real drag (see handlePointerMove).
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || pointerId.current === null) return;

    const delta = e.clientX - startX.current;

    if (!isDragging.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return; // still just a click, do nothing
      // Threshold crossed — this is now a real drag. Capture the pointer.
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
    // didDrag stays true briefly so the upcoming click gets suppressed; cleared there.
  };

  // Suppress the click only when a real drag happened
  const handleClickCapture = (e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={handleClickCapture}
        className={`flex gap-2 ${
          onInputTop
            ? "flex-nowrap overflow-x-auto no-scrollbar justify-start cursor-grab active:cursor-grabbing select-none"
            : "flex-wrap justify-center"
        }`}
        style={onInputTop ? { touchAction: "pan-x" } : undefined}
      >
        {ASK_ACTIONS.map(({ mode, message, label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="xs"
            disabled={disabled}
            onClick={() => onAsk(mode, message)}
            className="rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
        {COMPOSE_ACTIONS.map(({ draft, label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="xs"
            disabled={disabled}
            onClick={() => onCompose(draft)}
            className="rounded-full border-dashed bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
          >
            <Icon className="mr-1 h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {onInputTop && showChevron && (
        <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center bg-gradient-to-l from-background via-background/80 to-transparent pl-4 pr-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      )}
    </div>
  );
}