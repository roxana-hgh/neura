import { useEffect, useState } from "react";
import FocusTimer from "@/features/focus/components/timer/FocusTimer";
import FocusOverview from "@/features/focus/components/sessions/FocusOverview";
import SessionSaveDialog from "@/features/focus/components/sessions/SessionSaveDialog";
import SessionHistory from "@/features/focus/components/sessions/SessionHistory";
import LeaveFocusDialog from "@/features/focus/components/sessions/LeaveFocusDialog";
import { useFocusTimer } from "@/features/focus/hooks/useFocusTimer";
import { useLeaveGuard } from "@/features/focus/hooks/useLeaveGuard";
import type { CompletedFocusSession } from "@/features/focus/types/focusSession";
import { formatClock } from "@/features/focus/utils/time";

function isTypingOrDialogOpen(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (el?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(el?.tagName ?? "")) return true;
  return document.querySelector("[role='dialog']") !== null;
}

function FocusSession() {
  const [pendingSession, setPendingSession] = useState<CompletedFocusSession | null>(null);
  const timer = useFocusTimer(setPendingSession);
  const blocker = useLeaveGuard(timer.hasProgress);
  const { toggle } = timer;

  // Space starts / pauses
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTypingOrDialogOpen(e)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  // Countdown in the tab title, visible from other tabs
  const { minutes, seconds } = formatClock(timer.remainingSeconds);
  useEffect(() => {
    if (timer.status === "idle") return;
    const previous = document.title;
    document.title = `${timer.status === "paused" ? "⏸" : "●"} ${minutes}:${seconds} · Focus`;
    return () => {
      document.title = previous;
    };
  }, [timer.status, minutes, seconds]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:space-y-6 md:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-card px-4 py-6 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-primary/5 to-transparent" />
        <header className="relative mb-6 text-center sm:mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Focus</h1>
          <p className="mt-1 text-sm text-muted-foreground">One task, no distractions.</p>
        </header>
        <div className="relative">
          <FocusTimer timer={timer} />
        </div>
      </section>

      <FocusOverview />
      <SessionHistory />

      <SessionSaveDialog pendingSession={pendingSession} onClose={() => setPendingSession(null)} />
      <LeaveFocusDialog blocker={blocker} timer={timer} />
    </div>
  );
}

export default FocusSession;
