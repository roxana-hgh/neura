import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@/lib/auth";

/** Rejects requests without a Better Auth session; sets `req.userId` otherwise. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = session.user.id;
  next();
}
