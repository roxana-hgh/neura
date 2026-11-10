import { Router } from "express";
import * as notes from "@/modules/notes/notes.controller";
import { unfurlLimiter } from "@/middleware/rate-limit";

// Mounted at /api/notes (behind requireAuth). Static paths come before /:id.
const router = Router();

router.get("/folders", notes.listFolders);
router.post("/folders", notes.createFolder);
router.patch("/folders/:id", notes.updateFolder);
router.delete("/folders/:id", notes.deleteFolder);
router.get("/link-options", notes.getLinkOptions);
router.get("/unfurl", unfurlLimiter, notes.unfurlLink);

router.get("/", notes.listNotes);
router.post("/", notes.createNote);
router.get("/:id", notes.getNote);
router.put("/:id", notes.updateNote);
router.patch("/:id/links", notes.setLinks);
router.delete("/:id", notes.deleteNote);

export default router;
