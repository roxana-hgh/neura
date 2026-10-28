import { Router } from "express";
import * as brainstorms from "@/modules/brainstorms/brainstorms.controller";

// Mounted at /api/brainstorms (behind requireAuth).
const router = Router();

router.get("/", brainstorms.listBrainstorms);
router.post("/", brainstorms.createBrainstorm);
// static path before /:id
router.delete("/processed", brainstorms.clearProcessed);
router.patch("/:id", brainstorms.updateBrainstorm);
router.delete("/:id", brainstorms.deleteBrainstorm);
router.post("/:id/keep", brainstorms.keepBrainstorm);
router.post("/:id/process", brainstorms.processBrainstorm);
router.post("/:id/restore", brainstorms.restoreBrainstorm);

export default router;
