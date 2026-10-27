import { LucideCheck, LucidePause, LucidePlay, LucideRotateCcw } from "lucide-react";
import { format } from "date-fns";
import type { FocusTimerControls } from "@/features/focus/hooks/useFocusTimer";
import { formatClock, formatDuration } from "@/features/focus/utils/time";
import DurationSelector from "@/features/focus/components/timer/DurationSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATUS_LABEL = { idle: "Ready", running: "Focusing", paused: "Paused" } as const;

function FocusTimer({ timer }: { timer: FocusTimerControls }) {
  const { status, remainingSeconds, elapsedSeconds, progress, endsAt } = timer;
  const { minutes, seconds } = formatClock(remainingSeconds);
  const isIdle = status === "idle";
  const isRunning = status === "running";

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8">
      {/* Progress ring */}
      <div className="relative size-64 sm:size-80">
        <div
          className={cn(
            "absolute inset-6 rounded-full bg-primary/10 blur-3xl transition-opacity duration-700",
            isRunning ? "opacity-100" : "opacity-0",
          )}
        />
        <svg viewBox="0 0 100 100" className="relative size-full -rotate-90">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="3" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className={cn(
              "transition-[stroke-dashoffset,stroke] duration-300 ease-linear",
              status === "paused" ? "stroke-amber-500" : "stroke-primary",
            )}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
              isRunning && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              status === "paused" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              isIdle && "bg-muted text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full bg-current",
                isRunning && "animate-pulse",
              )}
            />
            {STATUS_LABEL[status]}
          </span>
          <div className="text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight text-foreground">
            {minutes}:{seconds}
          </div>
          <p className="h-4 text-xs text-muted-foreground tabular-nums">
            {endsAt
              ? `Ends at ${format(endsAt, "HH:mm")}`
              : status === "paused"
                ? `${formatDuration(elapsedSeconds)} focused`
                : "Pick a length and start"}
          </p>
        </div>
      </div>

      {/* Length picker only before the session starts, so the layout doesn't jump */}
      <div className="flex min-h-22 items-center">
        {isIdle ? (
          <DurationSelector />
        ) : (
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Keep going. The timer keeps running if you switch tabs.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-start justify-center gap-6">
        <ControlButton label="Reset" disabled={isIdle} onClick={timer.reset}>
          <LucideRotateCcw />
        </ControlButton>

        <div className="flex flex-col items-center gap-1.5">
          <Button
            size="icon"
            onClick={timer.toggle}
            aria-label={isRunning ? "Pause" : isIdle ? "Start" : "Resume"}
            className="size-16 rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95 [&_svg:not([class*='size-'])]:size-7"
          >
            {isRunning ? <LucidePause /> : <LucidePlay className="translate-x-0.5" />}
          </Button>
          <span className="text-xs font-medium text-foreground">
            {isRunning ? "Pause" : isIdle ? "Start" : "Resume"}
          </span>
        </div>

        <ControlButton label="Finish" disabled={isIdle} onClick={timer.finish}>
          <LucideCheck />
        </ControlButton>
      </div>

      <p className="hidden text-[11px] text-muted-foreground md:block">
        Press <kbd className="rounded border px-1 font-mono">Space</kbd> to start or pause
      </p>
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ControlButton({ label, disabled, onClick, children }: ControlButtonProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5 pt-2 transition-opacity", disabled && "opacity-40")}>
      <Button
        size="icon"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        className="size-12 rounded-full [&_svg:not([class*='size-'])]:size-5"
      >
        {children}
      </Button>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default FocusTimer;
