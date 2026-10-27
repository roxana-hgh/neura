import { Router } from "express";
import * as users from "@/modules/users/users.controller";

// Mounted at /api/users (behind requireAuth).
const router = Router();

router.get("/me", users.getMe);
router.patch("/me", users.updateMe);

export default router;
