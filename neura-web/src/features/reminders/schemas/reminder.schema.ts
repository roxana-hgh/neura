import { z } from "zod";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const reminderFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().max(1000, "Too long"),
    date: z.string().regex(DAY_KEY, "Pick a date"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
    repeat: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int("Whole numbers only").min(1, "At least 1").max(365, "Too large"),
    weekdays: z.array(z.number().int().min(0).max(6)),
    hasEnd: z.boolean(),
    endDate: z.string(),
  })
  .refine((v) => !v.hasEnd || v.repeat === "none" || (DAY_KEY.test(v.endDate) && v.endDate >= v.date), {
    message: "End date must be on or after the start",
    path: ["endDate"],
  });

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;
