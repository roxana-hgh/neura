import { useEffect, useRef, useState } from "react";
import { useFocusTimerStore } from "@/features/focus/stores/focusTimerStore";
import type { CompletedFocusSession } from "@/features/focus/types/focusSession";
import { announceSessionComplete, primeFocusAlerts } from "@/features/focus/utils/notify";

export type TimerStatus = "idle" | "running" | "paused";

interface TimerState {
  status: TimerStatus;
  plannedMs: number;
  endAt: number; // running: wall-clock time (ms) when the timer reaches zero
  remainingMs: number; // paused: time left at the moment of pausing
  startTime: Date | null;
}

const IDLE: TimerState = { status: "idle", plannedMs: 0, endAt: 0, remainingMs: 0, startTime: null };

/**
 * Countdown based on wall-clock timestamps instead of counting ticks, so it stays
 * correct when the tab is in the background (browsers throttle intervals there).
 */
export function useFocusTimer(onComplete: (session: CompletedFocusSession) => void) {
  const durationMinutes = useFocusTimerStore((s) => s.durationMinutes);
  const [state, setState] = useState<TimerState>(IDLE);
  const [now, setNow] = useState(() => Date.now());

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (state.status !== "running") return;
    const { endAt, plannedMs, startTime } = state;

    const tick = () => {
      const t = Date.now();
      if (t < endAt) {
        setNow(t);
        return;
      }
      setState(IDLE);
      onCompleteRef.current({ duration: Math.round(plannedMs / 1000), startTime: startTime!, endTime: new Date(endAt) });
      announceSessionComplete(Math.round(plannedMs / 60_000));
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };

    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state]);

  const remainingMs =
    state.status === "running"
      ? Math.min(state.plannedMs, Math.max(0, state.endAt - now))
      : state.status === "paused"
        ? state.remainingMs
        : durationMinutes * 60_000;

  const start = () => {
    primeFocusAlerts();
    const t = Date.now();
    setNow(t);
    setState((s) => {
      if (s.status === "running") return s;
      if (s.status === "paused") return { ...s, status: "running", endAt: t + s.remainingMs };
      const plannedMs = durationMinutes * 60_000;
      return { status: "running", plannedMs, endAt: t + plannedMs, remainingMs: plannedMs, startTime: new Date(t) };
    });
  };

  const pause = () =>
    setState((s) => (s.status === "running" ? { ...s, status: "paused", remainingMs: Math.max(0, s.endAt - Date.now()) } : s));

  const toggle = () => (state.status === "running" ? pause() : start());

  const reset = () => setState(IDLE);

  /** Stop now and hand the focused time so far to `onComplete`. */
  const finish = () => {
    if (state.status === "idle" || !state.startTime) return;
    const left = state.status === "running" ? Math.max(0, state.endAt - Date.now()) : state.remainingMs;
    const focusedSeconds = Math.round((state.plannedMs - left) / 1000);
    setState(IDLE);
    if (focusedSeconds > 0) onCompleteRef.current({ duration: focusedSeconds, startTime: state.startTime, endTime: new Date() });
  };

  const elapsedSeconds = state.status === "idle" ? 0 : Math.round((state.plannedMs - remainingMs) / 1000);

  return {
    status: state.status,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    elapsedSeconds,
    progress: state.status === "idle" ? 0 : 1 - remainingMs / state.plannedMs,
    endsAt: state.status === "running" ? new Date(state.endAt) : null,
    startTime: state.startTime,
    hasProgress: state.status !== "idle",
    start,
    pause,
    toggle,
    reset,
    finish,
  };
}

export type FocusTimerControls = ReturnType<typeof useFocusTimer>;
