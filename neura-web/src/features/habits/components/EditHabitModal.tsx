import { useEffect, useState } from "react";
import { useUpdateHabit } from "@/features/habits/hooks/useHabits";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DurationUnit, Habit } from "@/features/habits/types/habit";
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

// Reverse of unitToDays — assumes 7 days/week, 30 days/month.
// Adjust here if your unitToDays uses different multipliers.
function daysToDurationInput(days: number): { value: number; unit: DurationUnit } {
  if (days % 30 === 0 && days / 30 >= 1) return { value: days / 30, unit: "month" };
  if (days % 7 === 0 && days / 7 >= 1) return { value: days / 7, unit: "week" };
  return { value: days, unit: "day" };
}

interface EditHabitModalProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHabitModal({ habit, open, onOpenChange }: EditHabitModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [durationEnabled, setDurationEnabled] = useState(false);
  const [durationValue, setDurationValue] = useState(21);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("day");
  const { mutate: updateHabit, isPending } = useUpdateHabit();

  // prefill whenever a new habit is opened for editing
  useEffect(() => {
    if (!habit || !open) return;
    setTitle(habit.title);
    setColor(habit.color);
    if (habit.durationDays == null) {
      setDurationEnabled(false);
      setDurationValue(21);
      setDurationUnit("day");
    } else {
      const { value, unit } = daysToDurationInput(habit.durationDays);
      setDurationEnabled(true);
      setDurationValue(value);
      setDurationUnit(unit);
    }
  }, [habit, open]);

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

  const handleSubmit = () => {
    if (!habit || !title.trim()) return;
    const durationDays = durationEnabled ? unitToDays(durationUnit, durationValue) : null;
    updateHabit(
      { id: habit.id, title: title.trim(), color, durationDays },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-habit-title">Title</Label>
            <Input
              id="edit-habit-title"
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
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}