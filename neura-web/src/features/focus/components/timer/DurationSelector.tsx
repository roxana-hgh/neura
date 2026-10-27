import { LucideMinus, LucidePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTimerStore } from "@/features/focus/stores/focusTimerStore";
import { cn } from "@/lib/utils";

const PRESETS = [15, 25, 45, 60];
const MIN = 1;
const MAX = 180;
const STEP = 5;

const clamp = (m: number) => Math.min(MAX, Math.max(MIN, m));

function DurationSelector() {
  const durationMinutes = useFocusTimerStore((s) => s.durationMinutes);
  const setDurationMinutes = useFocusTimerStore((s) => s.setDurationMinutes);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex items-center gap-1 rounded-full border bg-muted/50 p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setDurationMinutes(preset)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium tabular-nums transition-colors",
              durationMinutes === preset
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {preset}m
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-full"
          aria-label={`${STEP} minutes less`}
          disabled={durationMinutes <= MIN}
          onClick={() => setDurationMinutes(clamp(durationMinutes - STEP))}
        >
          <LucideMinus />
        </Button>
        <label className="flex items-baseline gap-1 text-sm text-muted-foreground">
          <input
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            value={durationMinutes}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value >= MIN && value <= MAX) setDurationMinutes(value);
            }}
            aria-label="Session length in minutes"
            className="w-12 rounded-md bg-transparent text-center text-base font-semibold text-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          min
        </label>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="rounded-full"
          aria-label={`${STEP} minutes more`}
          disabled={durationMinutes >= MAX}
          onClick={() => setDurationMinutes(clamp(durationMinutes + STEP))}
        >
          <LucidePlus />
        </Button>
      </div>
    </div>
  );
}

export default DurationSelector;
