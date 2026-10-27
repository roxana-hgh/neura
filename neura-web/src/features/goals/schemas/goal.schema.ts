import { z } from "zod";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const isNum = (s: string) => s.trim() !== "" && Number.isFinite(Number(s));

export const goalFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give your goal a name").max(120, "Title is too long"),
    successCriteria: z.string().max(300, "Too long"),
    description: z.string().max(2000, "Too long"),
    category: z.string().max(40, "Too long"),
    color: z.enum(["blue", "green", "red", "yellow", "orange", "pink", "purple", "gray"]),
    period: z.enum(["weekly", "monthly", "quarterly", "half_year", "yearly", "custom"]),
    startDate: z.string().regex(DAY_KEY, "Pick a start date"),
    endDate: z.string().regex(DAY_KEY, "Pick an end date"),
    metric: z.enum(["numeric", "milestone", "task", "manual"]),
    // number inputs are kept as text so an empty field isn't NaN
    startValue: z.string(),
    targetValue: z.string(),
    unit: z.string().max(20, "Too long"),
    presets: z.array(z.enum(["review", "checkin", "deadline"])),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "Ends before it starts", path: ["endDate"] })
  .refine((v) => v.metric !== "numeric" || isNum(v.targetValue), { message: "Enter a target number", path: ["targetValue"] })
  .refine((v) => v.metric !== "numeric" || v.startValue.trim() === "" || isNum(v.startValue), {
    message: "Must be a number", path: ["startValue"],
  })
  .refine((v) => v.metric !== "numeric" || !isNum(v.targetValue) || Number(v.targetValue) !== Number(v.startValue || 0), {
    message: "Target must differ from the start", path: ["targetValue"],
  });

export type GoalFormValues = z.infer<typeof goalFormSchema>;
