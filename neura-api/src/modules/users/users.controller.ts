import type { Request, Response } from "express";
import * as usersService from "@/modules/users/users.service";
import { isWeekStartsOn } from "@/utils/date";

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

// PATCH /api/users/me  { name?, age?, job?, gender?, weekStartsOn? (6 | 0 | 1) }
export async function updateMe(req: Request, res: Response) {
  const { name, age, job, gender, weekStartsOn } = req.body;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }
  if (age !== undefined && age !== null && (typeof age !== "number" || age < 0 || age > 150)) {
    return res.status(400).json({ error: "Invalid age" });
  }
  if (weekStartsOn !== undefined && !isWeekStartsOn(weekStartsOn)) {
    return res.status(400).json({ error: "Week must start on Saturday, Sunday or Monday" });
  }

  try {
    res.json(await usersService.updateProfile(req.userId!, { name, age, job, gender, weekStartsOn }));
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
}
