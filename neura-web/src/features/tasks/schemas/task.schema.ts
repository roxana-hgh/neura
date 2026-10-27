import { z } from "zod";

export const TaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),

  priority: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Please select a valid priority" }),
  }),

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

  list_id: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => val ?? null),
});

export type TaskFormValues = z.infer<typeof TaskSchema>;