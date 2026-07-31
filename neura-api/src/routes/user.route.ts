import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/requireAuth";


const router = Router();

const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  age: true,
  job: true,
  gender: true,
  createdAt: true,
};

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: profileSelect,
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  const { name, age, job, gender } = req.body;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }
  if (age !== undefined && age !== null && (typeof age !== "number" || age < 0 || age > 150)) {
    return res.status(400).json({ error: "Invalid age" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(age !== undefined && { age }),
        ...(job !== undefined && { job }),
        ...(gender !== undefined && { gender }),
      },
      select: profileSelect,
    });

    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;