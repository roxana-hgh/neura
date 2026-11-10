import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";
import { authLimiter, credentialsLimiter, signUpLimiter } from "@/middleware/rate-limit";

// Mounted at /api/auth — Better Auth handles sign-up, sign-in, session and sign-out.
const router = Router();

router.use(authLimiter);
// password guessing: only failed attempts count
router.use(
  ["/sign-in", "/sign-up", "/forget-password", "/request-password-reset", "/reset-password", "/change-password"],
  credentialsLimiter,
);
router.post("/sign-up/{*path}", signUpLimiter);

router.all("/{*path}", toNodeHandler(auth)); // Express 5 wildcard syntax

export default router;
