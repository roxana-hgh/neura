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

export const ListSchema = z.object({
  name: z
    .string()
    .min(1, "List name is required")
    .max(50, "List name must be 50 characters or less"),

  color: z.enum(colorValues, { message: "Please select a color" }),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
});

export type ListFormInput = z.input<typeof ListSchema>;
export type ListFormValues = z.output<typeof ListSchema>;