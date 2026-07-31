import express from "express";
import cors from "cors";
import "dotenv/config";
import authRouter from "./routes/auth.route";
import tasksRouter from "./routes/tasks.route";
import notesRouter from "./routes/notes.route";
import focusSessionRouter from "./routes/focusSession.route";
import userRouter from "./routes/user.route";
import assistantRouter from "./routes/assistant.route";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CORS_ORIGIN, // deployed frontend
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins as string[],
  credentials: true,
}));

app.use(express.json());

app.options("/{*path}", cors());




app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);
app.use("/api/focus-sessions", focusSessionRouter);
app.use("/api/users", userRouter);
app.use("/api/assistant", assistantRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;