import { Router } from "express";
import * as notes from "@/modules/notes/notes.controller";

// Mounted at /api/notes (behind requireAuth).
const router = Router();

router.get("/", notes.listNotes);
router.post("/", notes.createNote);
router.get("/:id", notes.getNote);
router.put("/:id", notes.updateNote);
router.delete("/:id", notes.deleteNote);

export default router;
