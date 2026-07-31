import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";

const router = Router();

router.all("/{*path}", toNodeHandler(auth));  // ← Express 5 syntax

export default router;