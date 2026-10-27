import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

// Mounted at /api/auth — Better Auth handles sign-up, sign-in, session and sign-out.
const router = Router();

router.all("/{*path}", toNodeHandler(auth)); // Express 5 wildcard syntax

export default router;
