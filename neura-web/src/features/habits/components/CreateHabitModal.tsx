import { useState } from "react";
import { useCreateHabit } from "@/features/habits/hooks/useHabits";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";




import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DurationUnit } from "@/features/habits/types/habit";
import { unitToDays } from "@/features/habits/lib/habitDate";
import { cn } from "@/lib/utils";



const COLORS = ["#f97316", "#8b5cf6", "#14b8a6", "#3b82f6", "#22c55e", "#ec4899", "#eab308", "#ef4444"];

interface Preset {
  label: string;
  enabled: boolean;
  value?: number;
  unit?: DurationUnit;
}

const PRESETS: Preset[] = [
  { label: "No due date", enabled: false },
  { label: "21 days", enabled: true, value: 21, unit: "day" },
  { label: "1 week", enabled: true, value: 1, unit: "week" },
  { label: "1 month", enabled: true, value: 1, unit: "month" },
];

interface CreateHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHabitModal({ open, onOpenChange }: CreateHabitModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [durationEnabled, setDurationEnabled] = useState(false); // default: no due date
  const [durationValue, setDurationValue] = useState(21);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("day");
  const { mutate: createHabit, isPending } = useCreateHabit();

  const applyPreset = (preset: Preset) => {
    setDurationEnabled(preset.enabled);
    if (preset.enabled) {
      setDurationValue(preset.value!);
      setDurationUnit(preset.unit!);
    }
  };

  const isActivePreset = (preset: Preset) =>
    preset.enabled === durationEnabled &&
    (!preset.enabled || (preset.value === durationValue && preset.unit === durationUnit));

  const reset = () => {
    setTitle("");
    setColor(COLORS[0]);
    setDurationEnabled(false);
    setDurationValue(21);
    setDurationUnit("day");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const durationDays = durationEnabled ? unitToDays(durationUnit, durationValue) : null;
    createHabit(
      { title: title.trim(), color, durationDays },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read, Workout, Meditate"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    isActivePreset(p)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {durationEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20"
                />
                <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as DurationUnit)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Days</SelectItem>
                    <SelectItem value="week">Weeks</SelectItem>
                    <SelectItem value="month">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full transition"
                  style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none" }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
            {isPending ? "Creating..." : "Create Habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}