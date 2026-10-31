import { z } from "zod";

export const MAX_ASSISTANT_INSTRUCTIONS = 1000;

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  age: z
    .string()
    .optional()
    .refine((val) => !val || (Number(val) >= 13 && Number(val) <= 120), {
      message: "Enter a valid age",
    }),
  job: z.string().trim().max(80, "Too long").optional(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional(),
  assistantInstructions: z
    .string()
    .trim()
    .max(MAX_ASSISTANT_INSTRUCTIONS, `Keep it under ${MAX_ASSISTANT_INSTRUCTIONS} characters`)
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;