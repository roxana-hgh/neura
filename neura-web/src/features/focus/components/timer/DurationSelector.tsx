import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusTimerStore } from "@/features/focus/stores/focusTimerStore";


const PRESETS = [15, 25, 45, 60];

function DurationSelector({ disabled }: { disabled?: boolean }) {
  const durationMinutes = useFocusTimerStore((s) => s.durationMinutes);
  const setDurationMinutes = useFocusTimerStore((s) => s.setDurationMinutes);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset}
          type="button"
          size="sm"
          variant={durationMinutes === preset ? "default" : "outline"}
          disabled={disabled}
          onClick={() => setDurationMinutes(preset)}
          className="rounded-full"
        >
          {preset}m
        </Button>
      ))}
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={1}
          max={180}
          value={durationMinutes}
          disabled={disabled}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value > 0 && value <= 180) setDurationMinutes(value);
          }}
           className="w-18 h-8 text-center rounded-full bg-stone-100 border-stone-200 text-stone-900 dark:bg-white/5 dark:border-white/10 dark:text-white"
        />
      <span className="text-sm text-stone-500 dark:text-neutral-500">min</span>
      </div>
    </div>
  );
}

export default DurationSelector;