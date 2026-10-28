import express from "express";
import cors from "cors";
import { allowedOrigins } from "@/config/env";
import { requireAuth } from "@/middleware/require-auth";
import { errorHandler, notFoundHandler } from "@/middleware/error-handler";
import authRoutes from "@/modules/auth/auth.routes";
import tasksRoutes from "@/modules/tasks/tasks.routes";
import notesRoutes from "@/modules/notes/notes.routes";
import habitsRoutes from "@/modules/habits/habits.routes";
import focusSessionsRoutes from "@/modules/focus-sessions/focus-sessions.routes";
import usersRoutes from "@/modules/users/users.routes";
import assistantRoutes from "@/modules/assistant/assistant.routes";
import goalsRoutes from "@/modules/goals/goals.routes";
import remindersRoutes from "@/modules/reminders/reminders.routes";
import brainstormsRoutes from "@/modules/brainstorms/brainstorms.routes";
import notificationsRoutes from "@/modules/notifications/notifications.routes";
import notificationsPublicRoutes from "@/modules/notifications/notifications.public.routes";

const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
// Notes embed images as data URLs, so allow bodies larger than the 100kb default
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Public
app.use("/api/auth", authRoutes);
// Push buttons (signed token) and external cron (secret header); falls through to the router below
app.use("/api/notifications", notificationsPublicRoutes);

// Authenticated — requireAuth sets req.userId for every route below
app.use("/api/tasks", requireAuth, tasksRoutes);
app.use("/api/notes", requireAuth, notesRoutes);
app.use("/api/habits", requireAuth, habitsRoutes);
app.use("/api/focus-sessions", requireAuth, focusSessionsRoutes);
app.use("/api/users", requireAuth, usersRoutes);
app.use("/api/assistant", requireAuth, assistantRoutes);
app.use("/api/goals", requireAuth, goalsRoutes);
app.use("/api/reminders", requireAuth, remindersRoutes);
app.use("/api/brainstorms", requireAuth, brainstormsRoutes);
app.use("/api/notifications", requireAuth, notificationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
