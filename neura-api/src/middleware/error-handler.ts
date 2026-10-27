import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/http-error";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// Express 5 forwards rejected async handlers here, so routes don't need try/catch.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Prisma "record to update/delete not found" (e.g. id belongs to another user)
  if ((err as { code?: string })?.code === "P2025") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
