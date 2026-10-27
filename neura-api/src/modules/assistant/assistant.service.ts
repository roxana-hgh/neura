import { runAssistantTurn } from "@/lib/groq";
import { buildTaskContext, buildHabitContext, buildUserProfile } from "@/modules/assistant/assistant.context";
import { SYSTEM_PROMPT, QUICK_INSTRUCTIONS, MUTATING_TOOLS } from "@/modules/assistant/assistant.prompts";
import { TASK_TOOLS, executeTaskTool } from "@/modules/assistant/tools/task.tools";
import { HABIT_TOOLS, HABIT_TOOL_NAMES, executeHabitTool } from "@/modules/assistant/tools/habit.tools";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequest {
  mode: string;
  question?: string;
  history?: HistoryTurn[];
  references?: { id: string; title: string; type: "task" | "habit" }[];
  clientDate?: string;
  timeZone?: string;
}

async function buildUserPrompt(
  userId: string,
  { mode, question, history = [], references = [], clientDate, timeZone }: AssistantRequest,
) {
  const instruction = QUICK_INSTRUCTIONS[mode] ?? question ?? "Summarize the user's tasks.";

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

  return `
${todayLine}
${profileBlock}

Task snapshot (JSON, may be slightly stale — call list_tasks for exact ids/fresh data):
${JSON.stringify(taskSnapshot)}

Habit snapshot (JSON, may be slightly stale — call list_habits for exact ids/fresh data):
${JSON.stringify(habitSnapshot)}

${referencesBlock}${conversation ? `Conversation so far:\n${conversation}\n` : ""}
Request: ${instruction}
`.trim();
}

/** One assistant turn: builds the prompt, runs the tool-calling loop, returns the reply + data-changing actions. */
export async function askAssistant(userId: string, request: AssistantRequest) {
  const { reply, actions } = await runAssistantTurn({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: await buildUserPrompt(userId, request),
    tools: [...TASK_TOOLS, ...HABIT_TOOLS],
    executeTool: (name, args) =>
      HABIT_TOOL_NAMES.has(name)
        ? executeHabitTool(name, args, userId)
        : executeTaskTool(name, args, userId),
  });

  return { reply, actions: actions.filter((a) => MUTATING_TOOLS.has(a.name)) };
}
