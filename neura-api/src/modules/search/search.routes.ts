import { Router } from "express";
import * as search from "@/modules/search/search.controller";

// Mounted at /api/search (behind requireAuth).
const router = Router();

router.get("/", search.search);

export default router;
