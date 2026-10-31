import { runAssistantTurn } from "@/lib/groq";
import {
  buildTaskContext,
  buildHabitContext,
  buildUserProfile,
  buildWorkspaceContext,
} from "@/modules/assistant/assistant.context";
import { withCustomInstructions, QUICK_INSTRUCTIONS, MUTATING_TOOLS } from "@/modules/assistant/assistant.prompts";
import { createToolbox, selectAreas } from "@/modules/assistant/assistant.toolbox";
import type { ToolContext } from "@/modules/assistant/tools/tool.utils";
import { isValidTimeZone } from "@/modules/reminders/reminders.utils";
import { dayKey } from "@/utils/date";

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

const REFERENCE_TYPES = ["task", "habit", "goal", "note", "reminder", "brainstorm"] as const;

export interface AssistantRequest {
  mode: string;
  question?: string;
  history?: HistoryTurn[];
  references?: { id: string; title: string; type: (typeof REFERENCE_TYPES)[number] }[];
  clientDate?: string;
  timeZone?: string;
}

type Profile = Awaited<ReturnType<typeof buildUserProfile>>;

// Referenced items from the "/" picker — sanitized, ids are still ownership-checked in the tools
const safeReferences = (references: AssistantRequest["references"] = []) =>
  references
    .filter((r) => r && /^[\w-]{1,40}$/.test(String(r.id)) && REFERENCE_TYPES.includes(r.type))
    .slice(0, 5);

async function buildUserPrompt(
  { userId, todayKey, timeZone }: ToolContext,
  profile: Profile,
  { mode, question, history = [], references, clientDate, timeZone: clientZone }: AssistantRequest,
) {
  const instruction = QUICK_INSTRUCTIONS[mode] ?? question ?? "Summarize the user's tasks.";

  // Fetch snapshots in parallel
  const [taskSnapshot, habitSnapshot, workspaceSnapshot] = await Promise.all([
    buildTaskContext(userId),
    buildHabitContext(userId),
    buildWorkspaceContext(userId, todayKey, timeZone),
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

  const safeRefs = safeReferences(references).map(
    (r) =>
      `- ${r.type} "${String(r.title).replace(/\s+/g, " ").slice(0, 120)}" id=${r.id}`,
  );

  const referencesBlock = safeRefs.length
    ? `Referenced items (real ids, use them directly):\n${safeRefs.join("\n")}\n`
    : "";

  const todayLine = `Today is ${String(clientDate ?? todayKey).slice(0, 40)}${
    clientZone ? ` (${String(clientZone).slice(0, 40)})` : ""
  }.`;

  return `
${todayLine}
${profileBlock}

Task snapshot (JSON, may be slightly stale — call list_tasks for exact ids/fresh data):
${JSON.stringify(taskSnapshot)}

Habit snapshot (JSON, may be slightly stale — call list_habits for exact ids/fresh data):
${JSON.stringify(habitSnapshot)}

Everything else (JSON summary):
${JSON.stringify(workspaceSnapshot)}

${referencesBlock}${conversation ? `Conversation so far:\n${conversation}\n` : ""}
Request: ${instruction}
`.trim();
}

/** The user's calendar day and zone come from the browser, so dates match what they see. */
function toolContext(userId: string, { clientDate, timeZone }: AssistantRequest): ToolContext {
  const clientDay = /\d{4}-\d{2}-\d{2}/.exec(String(clientDate ?? ""))?.[0];
  return {
    userId,
    todayKey: clientDay ?? dayKey(new Date()),
    timeZone: isValidTimeZone(timeZone) ? timeZone : "UTC",
  };
}

/** One assistant turn: builds the prompt, runs the tool-calling loop, returns the reply + data-changing actions. */
export async function askAssistant(userId: string, request: AssistantRequest) {
  const ctx = toolContext(userId, request);
  const profile = await buildUserProfile(userId);

  // Recent turns count, so a follow-up like "yes, do it" keeps the tools it's about
  const recentText = [
    ...(request.history ?? []).slice(-2).map((t) => String(t.content)),
    String(request.question ?? ""),
  ].join("\n");
  const areas = selectAreas(request.mode, recentText, safeReferences(request.references).map((r) => r.type));
  const toolbox = createToolbox(ctx, areas);

  const { reply, actions } = await runAssistantTurn({
    systemPrompt: withCustomInstructions(profile?.assistantInstructions),
    userPrompt: await buildUserPrompt(ctx, profile, request),
    // the dashboard card only summarizes, so it doesn't pay for tool schemas
    getTools: () => (request.mode === "daily_plan" ? [] : toolbox.getTools()),
    executeTool: toolbox.execute,
  });

  return { reply, actions: actions.filter((a) => MUTATING_TOOLS.has(a.name)) };
}
