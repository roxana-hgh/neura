import { z } from "zod";

export const TaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),

  priority: z.enum(["low", "medium", "high"], { message: "Please select a valid priority" }),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .nullable()
    .optional()
    .transform((val) => val ?? null),

  due_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? null),

  due_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a valid time")
    .nullable()
    .optional()
    .transform((val) => val ?? null),

  list_id: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => val ?? null),

  tag_ids: z.array(z.string()).optional(),

  // a repeating task needs a due date; TaskForm fills today when none is picked
  repeat: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
  repeat_interval: z
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .min(1, "At least 1")
    .max(365, "At most 365")
    .optional(),
  repeat_weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  repeat_until: z.string().nullable().optional(),
});

export type TaskFormInput = z.input<typeof TaskSchema>;
export type TaskFormValues = z.output<typeof TaskSchema>;