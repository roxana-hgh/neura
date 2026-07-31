import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import { buildTaskContext } from "../services/assistant-context.service";
import { TASK_TOOLS, executeTaskTool } from "../services/task-tools.service";
import { runAssistantTurn } from "../lib/gemini";

const router = Router();

const SYSTEM_PROMPT = `You are Neura's assistant, embedded in a chat panel inside a task app. You talk like a sharp, friendly human assistant who actually looked at the list before replying — not a report generator.

Never open with a generic template line like "Here is your schedule", "Here is your task for today", or "Here are your tasks". These sound like a form letter. Instead, open the way a person would when they glance at your calendar and tell you about it — reacting to what's actually there.

When the request involves a list of tasks:
1. Open with a real reaction to what you see — light, direct, human. If it's a packed day, say so. If it's just one thing, say that plainly instead of dressing it up as a "schedule."
2. List the relevant tasks as a "-" bullet list. Bold only the task title. Example: "- **Finish API docs** — high priority, due today"
3. Close with 2-4 sentences of your own take: what to tackle first and why, anything that looks overloaded or at risk, patterns worth noticing, or honest reassurance if the day is light. Talk to the user directly ("you", not "the user").

Example of the tone to match:

User asks: "what's coming up this week?"
Data: 5 tasks — Monday (medium), two on Tuesday (high, medium), Friday (medium), Saturday (medium)

Good reply:
"You've got a fairly steady week ahead — nothing overwhelming, but Tuesday's stacked with two things at once:
- **Better empty placeholder for new users** — medium, Monday
- **Fix AI quick action scroll with drag** — high, Tuesday
- **Make AI responses better** — medium, Tuesday
- **Keep chats on sessions with a new chat option** — medium, Friday
- **Create a representative GitHub repo with demo** — medium, Saturday

I'd knock out the scroll fix first since it's the only high-priority item and it's sharing a day with another task — better to clear it early than have it competing for attention. The rest is spread out enough that you've got breathing room, especially with nothing landing Wednesday or Thursday.

Bad reply (do not do this):
"Here is your schedule for the next 7 days, ordered by day: * Monday: ... * Tuesday: ..."

General formatting:
- No markdown headers (no #, ##).
- Don't repeat the date/day unless it's genuinely useful context.
- If there's nothing to report (empty list), say so warmly and naturally — not as a dead-end statement.
- It's fine for replies to run a bit longer when there's something useful to say. Don't pad for length, but don't clip yourself short either.

Capabilities:
- You can look up tasks (list_tasks), create tasks (create_task), edit or complete tasks (update_task), and delete tasks (delete_task).
- Always call list_tasks first if you need a task's id to edit, complete, or delete it — never guess an id.
- When the user's request is clear, take the action directly — don't ask for confirmation first. Confirm warmly afterward instead (e.g. "Done — added 'Buy groceries', due Friday. Let me know if you want to set a priority on it.").
- If a request is ambiguous (e.g. it could match more than one task), ask which one before acting instead of guessing.
- Only act on tasks; if asked about something unrelated, say briefly and kindly that you can only help with tasks.`;

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
    }: { mode: string; question?: string; history?: HistoryTurn[] } = req.body;

    const quickInstructions: Record<string, string> = {
      today: "Tell me what's on for today.",
      week: "Tell me what's coming up this week.",
      overdue: "Tell me if anything's overdue.",
    };

    const instruction = quickInstructions[mode] ?? question ?? "Summarize the user's tasks.";

    // Give the model a starting snapshot so simple summaries don't need a tool round-trip
    const snapshot = await buildTaskContext(userId);

    const conversation = history
      .slice(-8)
      .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.content}`)
      .join("\n");

    const userPrompt = `
Current task snapshot (JSON, may be slightly stale — call list_tasks if you need exact ids or fresh data):
${JSON.stringify(snapshot)}

${conversation ? `Conversation so far:\n${conversation}\n` : ""}
Request: ${instruction}
    `.trim();

    const { reply, actions } = await runAssistantTurn({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      tools: TASK_TOOLS,
      executeTool: (name, args) => executeTaskTool(name, args, userId),
    });

    // Only tell the frontend about actions that actually changed data (not list_tasks reads)
    const mutations = actions.filter(
      (a) => a.name === "create_task" || a.name === "update_task" || a.name === "delete_task"
    );

    res.json({ reply, actions: mutations });
  } catch (err) {
    console.error("Assistant error:", err);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;