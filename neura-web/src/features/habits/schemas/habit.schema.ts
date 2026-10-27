import { z } from "zod";

export const HABIT_COLORS = [
  "#f97316", "#ef4444", "#ec4899", "#a855f7", "#8b5cf6", "#3b82f6",
  "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16", "#eab308", "#64748b",
];

export const habitFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60, "Title is too long"),
  color: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date"),
  hasDuration: z.boolean(),
  durationValue: z.number().int("Whole numbers only").min(1, "At least 1").max(999, "Too long"),
  durationUnit: z.enum(["day", "week", "month"]),
});

export type HabitFormValues = z.infer<typeof habitFormSchema>;
