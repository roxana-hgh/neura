import { Router } from "express";
import * as notifications from "@/modules/notifications/notifications.controller";

// Mounted at /api/notifications BEFORE the authenticated router, without requireAuth:
// - /action:   buttons on a push, called by the service worker with a signed token
// - /dispatch: external cron, guarded by the x-cron-secret header
const router = Router();

router.post("/action", notifications.runAction);
router.post("/dispatch", notifications.dispatch);

export default router;
