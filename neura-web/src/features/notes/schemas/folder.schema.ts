import { z } from "zod";

export const FolderSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(60, "Folder name must be 60 characters or less"),
  color: z.enum(["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"]),
  /** "none" = not linked to a goal */
  goalId: z.string(),
});

export type FolderFormValues = z.infer<typeof FolderSchema>;
