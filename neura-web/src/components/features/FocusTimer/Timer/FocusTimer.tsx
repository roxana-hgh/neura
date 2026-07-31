import { LucidePause, LucidePlay, LucideRotateCcw, LucideCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFocusTimerStore } from "../stores/focusTimerStore";
import { formatClock } from "../utils/time";
import DurationSelector from "./DurationSelector";
import { Button } from "../../../ui/button";


interface Props {
  onSessionComplete: (result: { duration: number; startTime: Date; endTime: Date }) => void;
}

function FocusTimer({ onSessionComplete }: Props) {
  const durationMinutes = useFocusTimerStore((s) => s.durationMinutes);
  const [totalSeconds, setTotalSeconds] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const plannedSecondsRef = useRef(durationMinutes * 60);

  useEffect(() => {
    if (!isRunning) setTotalSeconds(durationMinutes * 60);
  }, [durationMinutes, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          finishSession(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const finishSession = (secondsRemaining: number) => {
    if (!sessionStartRef.current) return;
    const endTime = new Date();
    const elapsed = plannedSecondsRef.current - secondsRemaining;
    onSessionComplete({ duration: elapsed, startTime: sessionStartRef.current, endTime });
    sessionStartRef.current = null;
  };

  const handleStart = () => {
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date();
      plannedSecondsRef.current = totalSeconds;
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    sessionStartRef.current = null;
    setTotalSeconds(durationMinutes * 60);
  };

  const handleFinishEarly = () => {
    setIsRunning(false);
    finishSession(totalSeconds);
    setTotalSeconds(durationMinutes * 60);
  };

  const { minutes, seconds } = formatClock(totalSeconds);
  const hasProgress = sessionStartRef.current !== null;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="text-8xl sm:text-9xl font-semibold tabular-nums tracking-tight">
        {minutes}:{seconds}
      </div>

      <DurationSelector disabled={isRunning || hasProgress} />

      <div className="flex justify-center gap-2">
        {isRunning ? (
          <>
            <Button size="lg" variant="outline" className="rounded-full" onClick={handlePause}>
              <LucidePause /> Pause
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={handleFinishEarly}>
              <LucideCheck /> Finish & Log
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="rounded-full px-8" onClick={handleStart}>
              <LucidePlay /> {hasProgress ? "Resume" : "Start Session"}
            </Button>
            {hasProgress && (
              <Button size="lg" variant="outline" className="rounded-full" onClick={handleReset}>
                <LucideRotateCcw /> Reset
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FocusTimer;