import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import {
  buildTaskContext,
  buildHabitContext,
  buildUserProfile,
} from "../services/assistant-context.service";
import { TASK_TOOLS, executeTaskTool } from "../services/task-tools.service";
import {
  HABIT_TOOLS,
  HABIT_TOOL_NAMES,
  executeHabitTool,
} from "../services/habit-tools.service";
import { runAssistantTurn, AssistantBusyError } from "../lib/groq";

const router = Router();

const SYSTEM_PROMPT = `You are Neura's assistant: a friendly, sharp personal assistant inside a task & habit app. Talk like a thoughtful colleague who just glanced at the user's list — warm, direct, a little playful, never robotic.

Voice
- Reply in the language the user writes in (Persian → Persian, English → English).
- Open by reacting to what you actually see ("Light day today", "Tuesday's stacked"). Never open with "Here is your…" or any template line.
- Short by default: 2–5 sentences, plus a list when there are tasks. Go longer only when it adds real value.
- Use the user's first name rarely (greetings, wins). Never recite their profile; let their job only flavor suggestions. Age/gender are never mentioned.
- At most one emoji per reply, only when it fits (a win, a streak).
- Celebrate real progress briefly. When the load is heavy, be reassuring, not alarmist.
- When useful, end with one concrete next step or a light question ("Want me to move these to tomorrow?"). Not every time.

Format
- No headers. Tasks and habits as "- " bullets with only the title in bold: "- **Finish API docs** — high, due today"; "- **Read 20 minutes** — 6-day streak, not done yet".
- Say "today", "tomorrow", "Friday" instead of ISO dates.
- Mention habit streaks of 3+ days or ones at risk of breaking. Don't force habits into task-only questions.

Doing things
- Tools: list/create/update/delete tasks and habits, log_habit_completion.
- If the message includes "Referenced items", use those ids directly — no list call.
- Otherwise call list_tasks / list_habits first to get a real id. Never guess ids.
- Clear request → just do it, then confirm in one friendly line ("Done — moved Fix scroll to Friday.").
- Ambiguous (matches several) → ask which one.
- Bulk or destructive changes (moving many tasks, deleting several) → propose first and wait for a yes. Deleting or editing a single item the user clearly named is fine to do directly.
- Resolve relative dates ("tomorrow", "next Monday") from the date given in the message and pass ISO dates (YYYY-MM-DD) to tools.
- Unrelated questions: say kindly that you only help with tasks and habits.

Special cases
- "What should I do / prioritize": one clear pick with a short reason (2–4 sentences), not a full list. A habit about to lose its streak is a valid pick.
- Empty list: say so warmly and point to something useful to do instead.
- mode "daily_plan" (dashboard card): max 2 sentences, no markdown, no bullets. Start with the user's name if known, name one task to start with and why; if nothing is due, suggest something else to make progress on.`;

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      mode,
      question,
      history = [],
      references = [],
      clientDate,
      timeZone,
    }: {
      mode: string;
      question?: string;
      history?: HistoryTurn[];
      references?: { id: string; title: string; type: "task" | "habit" }[];
      clientDate?: string;
      timeZone?: string;
    } = req.body;

    const quickInstructions: Record<string, string> = {
      today: "Tell me what's on for today — tasks and habits.",
      week: "Tell me what's coming up this week.",
      upcoming:
        "Tell me what's coming up — no specific timeframe, just everything on the horizon.",
      overdue: "Tell me if anything's overdue.",
      suggestion:
        "Look at everything on my plate right now and give me one clear suggestion for what to prioritize or how to approach it.",
      daily_plan: "Give me a short daily plan for today.",

      plan_day:
        "Help me plan today, tasks and habits together. Suggest an order: what to start with, what can wait, and flag anything overloaded. Don't change anything.",
      next_up:
        "What's the single best thing for me to start on right now? One clear pick and a short why.",
      reschedule_overdue:
        "Look at my overdue tasks and propose a realistic new date for each. List your proposal and ask me to confirm before changing anything. If nothing is overdue, say so and cheer me on.",
      plan_week:
        "Look at my week: where is it heavy, where is it light? Suggest how to balance it. Don't change anything yet.",
      habit_checkin:
        "How are my habits going? Call out streaks at risk today and any streak worth celebrating.",
      wrap_up:
        "Help me wrap up my day: what I got done, what's still open, and which open tasks you'd move to tomorrow. Ask before moving anything.",
    };

    const instruction =
      quickInstructions[mode] ?? question ?? "Summarize the user's tasks.";

    // Fetch snapshots + profile in parallel
    const [taskSnapshot, habitSnapshot, profile] = await Promise.all([
      buildTaskContext(userId),
      buildHabitContext(userId),
      buildUserProfile(userId),
    ]);

    const conversation = history
      .slice(-6)
      .map(
        (t) =>
          `${t.role === "user" ? "User" : "Assistant"}: ${String(t.content).slice(0, 500)}`,
      )
      .join("\n");
    // Only include fields that are actually set — never inject placeholder
    // strings like "unknown" into the prompt, the model can end up echoing them.
    const profileParts: string[] = [];
    if (profile?.name) profileParts.push(`name: ${profile.name}`);
    if (profile?.job) profileParts.push(`job: ${profile.job}`);
    if (profile?.age) profileParts.push(`age: ${profile.age}`);

    const profileBlock =
      profileParts.length > 0
        ? `About the user — ${profileParts.join(", ")}`
        : "About the user: no profile info available.";

    // Referenced items from the "/" picker — sanitized, ids are still ownership-checked in the tools
    const safeRefs = references
      .filter(
        (r) =>
          r &&
          /^[\w-]{1,40}$/.test(String(r.id)) &&
          (r.type === "task" || r.type === "habit"),
      )
      .slice(0, 5)
      .map(
        (r) =>
          `- ${r.type} "${String(r.title).replace(/\s+/g, " ").slice(0, 120)}" id=${r.id}`,
      );

    const referencesBlock = safeRefs.length
      ? `Referenced items (real ids, use them directly):\n${safeRefs.join("\n")}\n`
      : "";

    const todayLine = `Today is ${String(clientDate ?? new Date().toISOString().slice(0, 10)).slice(0, 40)}${
      timeZone ? ` (${String(timeZone).slice(0, 40)})` : ""
    }.`;

    const userPrompt = `
${todayLine}
${profileBlock}

Task snapshot (JSON, may be slightly stale — call list_tasks for exact ids/fresh data):
${JSON.stringify(taskSnapshot)}

Habit snapshot (JSON, may be slightly stale — call list_habits for exact ids/fresh data):
${JSON.stringify(habitSnapshot)}

${referencesBlock}${conversation ? `Conversation so far:\n${conversation}\n` : ""}
Request: ${instruction}${mode === "custom" || !quickInstructions[mode] ? "" : ""}
`.trim();

    const { reply, actions } = await runAssistantTurn({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      tools: [...TASK_TOOLS, ...HABIT_TOOLS],
      executeTool: (name, args) =>
        HABIT_TOOL_NAMES.has(name)
          ? executeHabitTool(name, args, userId)
          : executeTaskTool(name, args, userId),
    });

    const mutations = actions.filter(
      (a) =>
        a.name === "create_task" ||
        a.name === "update_task" ||
        a.name === "delete_task" ||
        a.name === "create_habit" ||
        a.name === "update_habit" ||
        a.name === "delete_habit" ||
        a.name === "log_habit_completion",
    );

    res.json({ reply, actions: mutations });
  } catch (err) {
    if (err instanceof AssistantBusyError) {
      res.set("Retry-After", String(err.retryAfterSec));
      return res.status(503).json({
        error: "busy",
        message:
          "The assistant is a bit busy right now. Try again in a moment.",
        retryAfterSec: err.retryAfterSec,
      });
    }
    console.error("Assistant error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;
