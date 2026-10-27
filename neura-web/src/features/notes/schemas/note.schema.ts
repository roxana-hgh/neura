import { z } from "zod";

const colorValues = [
  "blue",
  "green",
  "red",
  "yellow",
  "orange",
  "pink",
  "purple",
  "gray",
] as const;

export const NoteSchema = z.object({
  title: z.string().min(1, "title is required").max(100, "title must be 100 characters or less"),
  color: z.enum(colorValues, {
    errorMap: () => ({ message: "Please select a color" }),
  }),
  description: z
    .string()
    .max(20000, "description must be 20000 characters or less")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
});

export type NoteFormValues = z.infer<typeof NoteSchema>;