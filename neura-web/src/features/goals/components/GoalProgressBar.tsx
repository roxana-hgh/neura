import { goalColor } from "@/features/goals/utils/goalStyles";
import { cn } from "@/lib/utils";

interface GoalProgressBarProps {
  progress: number;
  /** Where progress "should" be by now; drawn as a thin marker */
  expected?: number;
  color: string;
  className?: string;
}

export function GoalProgressBar({ progress, expected, color, className }: GoalProgressBarProps) {
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-visible rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", goalColor(color).bar)}
        style={{ width: `${Math.max(progress, progress > 0 ? 2 : 0)}%` }}
      />
      {expected !== undefined && expected > 0 && expected < 100 && (
        <div
          className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-foreground/30"
          style={{ left: `calc(${expected}% - 1px)` }}
          title={`Expected by now: ${expected}%`}
        />
      )}
    </div>
  );
}
