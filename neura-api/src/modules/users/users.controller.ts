import type { Request, Response } from "express";
import { z } from "zod";
import * as usersService from "@/modules/users/users.service";
import { isWeekStartsOn } from "@/utils/date";
import { parse, requiredText } from "@/utils/validate";

const nullableText = (max: number) => z.string({ error: "must be text" }).trim().max(max, `must be ${max} characters or less`).nullable();

const profileBody = z.object({
  name: requiredText(100).optional(),
  age: z.number({ error: "must be a number" }).int("must be a whole number").min(0).max(150).nullable().optional(),
  job: nullableText(100).optional(),
  gender: nullableText(50).optional(),
  weekStartsOn: z.custom<0 | 1 | 6>(isWeekStartsOn, "Week must start on Saturday, Sunday or Monday").optional(),
  assistantInstructions: z.string({ error: "must be text" }).nullable().optional().refine(
    (v) => !v || v.trim().length <= usersService.MAX_ASSISTANT_INSTRUCTIONS,
    `Custom instructions must be ${usersService.MAX_ASSISTANT_INSTRUCTIONS} characters or less`,
  ),
});

// GET /api/users/me
export async function getMe(req: Request, res: Response) {
  try {
    const user = await usersService.getProfile(req.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

// PATCH /api/users/me  { name?, age?, job?, gender?, weekStartsOn? (6 | 0 | 1), assistantInstructions? }
export async function updateMe(req: Request, res: Response) {
  const input = parse(profileBody, req.body);

  try {
    res.json(await usersService.updateProfile(req.userId!, input));
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
}
