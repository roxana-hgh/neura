import { useState } from "react";
import { useCreateHabit } from "../hooks/useHabits";
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, Dialog } from "../../../ui/dialog";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";


const COLORS = ["#f97316", "#8b5cf6", "#14b8a6", "#3b82f6", "#22c55e", "#ec4899", "#eab308", "#ef4444"];

interface CreateHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHabitModal({ open, onOpenChange }: CreateHabitModalProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [durationWeeks, setDurationWeeks] = useState(3);
  const { mutate: createHabit, isPending } = useCreateHabit();

  const handleSubmit = () => {
    if (!title.trim()) return;
    createHabit(
      { title: title.trim(), color, durationWeeks },
      {
        onSuccess: () => {
          setTitle("");
          setColor(COLORS[0]);
          setDurationWeeks(3);
          onOpenChange(false);
        },
      }
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
            <Input id="habit-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Read, Workout, Meditate" autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-duration">Duration (weeks)</Label>
            <Input id="habit-duration" type="number" min={1} max={52} value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value) || 1)} />
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