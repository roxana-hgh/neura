import { Router } from "express";
import * as notifications from "@/modules/notifications/notifications.controller";

// Mounted at /api/notifications (behind requireAuth).
const router = Router();

router.get("/public-key", notifications.getPublicKey);
router.post("/subscription", notifications.saveSubscription);
router.delete("/subscription", notifications.deleteSubscription);
router.get("/settings", notifications.getSettings);
router.patch("/settings", notifications.updateSettings);
router.post("/test", notifications.sendTest);
router.get("/inbox", notifications.getInbox);

export default router;
