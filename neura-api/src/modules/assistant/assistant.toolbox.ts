import { HttpError } from "@/utils/http-error";
import type { ToolContext } from "@/modules/assistant/tools/tool.utils";
import { TASK_TOOLS, TASK_DETAIL_TOOLS, executeTaskTool } from "@/modules/assistant/tools/task.tools";
import { HABIT_TOOLS, executeHabitTool } from "@/modules/assistant/tools/habit.tools";
import { GOAL_TOOLS, executeGoalTool } from "@/modules/assistant/tools/goal.tools";
import { REMINDER_TOOLS, executeReminderTool } from "@/modules/assistant/tools/reminder.tools";
import { BRAINSTORM_TOOLS, executeBrainstormTool } from "@/modules/assistant/tools/brainstorm.tools";
import { NOTE_TOOLS, executeNoteTool } from "@/modules/assistant/tools/note.tools";
import { INSIGHT_TOOLS, executeInsightTool } from "@/modules/assistant/tools/insight.tools";
import { SEARCH_TOOLS, executeSearchTool } from "@/modules/assistant/tools/search.tools";

/**
 * Which tools the model sees on each round. Every schema counts toward Groq's 8K tokens-per-minute
 * limit, so only the core set is always sent. The other areas are added when the request is about
 * them, or when the model asks for them with `load_tools`.
 */

type Execute = (name: string, args: any, ctx: ToolContext) => Promise<any>;

interface ToolGroup {
  tools: { functionDeclarations: { name: string }[] }[];
  execute: Execute;
}

const CORE_GROUPS: ToolGroup[] = [
  { tools: TASK_TOOLS, execute: (name, args, ctx) => executeTaskTool(name, args, ctx.userId) },
  { tools: HABIT_TOOLS, execute: (name, args, ctx) => executeHabitTool(name, args, ctx.userId) },
  { tools: SEARCH_TOOLS, execute: executeSearchTool },
];

const AREAS = {
  task_details: { tools: TASK_DETAIL_TOOLS, execute: (name, args, ctx) => executeTaskTool(name, args, ctx.userId) },
  goals: { tools: GOAL_TOOLS, execute: executeGoalTool },
  reminders: { tools: REMINDER_TOOLS, execute: executeReminderTool },
  brainstorms: { tools: BRAINSTORM_TOOLS, execute: executeBrainstormTool },
  notes: { tools: NOTE_TOOLS, execute: executeNoteTool },
  insights: { tools: INSIGHT_TOOLS, execute: executeInsightTool },
} satisfies Record<string, ToolGroup>;

export type ToolArea = keyof typeof AREAS;

const AREA_NAMES = Object.keys(AREAS) as ToolArea[];
const isArea = (v: unknown): v is ToolArea => AREA_NAMES.includes(v as ToolArea);

const LOAD_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "load_tools",
        description:
          "Unlock more tools for this turn. task_details: subtasks, lists, bulk task changes. goals, reminders, brainstorms, notes: read and change them. insights: stats and focus sessions.",
        parameters: {
          type: "object",
          properties: { areas: { type: "array", items: { type: "string", enum: AREA_NAMES } } },
          required: ["areas"],
        },
      },
    ],
  },
];

// Both languages the assistant speaks. A miss only costs one `load_tools` round.
const AREA_KEYWORDS: Record<ToolArea, RegExp> = {
  task_details: /subtask|sub-task|checklist|break.*down|\bsteps?\b|\blists?\b|\bbulk\b|\ball\b|زیر ?تسک|زیرکار|چک ?لیست|خرد کن|مرحله|قدم|لیست|همه/i,
  goals: /\bgoals?\b|\btargets?\b|objective|milestone|\bokrs?\b|هدف|اهداف/i,
  reminders: /remind|\balarm\b|snooze|یادآور|یادم بنداز|یادم باشه|هشدار|آلارم/i,
  brainstorms: /brainstorm|\bideas?\b|\binbox\b|ایده|برینستورم|طوفان فکری|فکرام/i,
  notes: /\bnotes?\b|\bjournal\b|یادداشت|نوت/i,
  insights: /\bfocus\b|pomodoro|\bstats?\b|statistic|analytic|insight|productiv|\breview\b|\breport\b|تمرکز|پومودورو|آمار|تحلیل|گزارش|بهره ?وری|مرور|عملکرد/i,
};

/** Quick actions that are known to need an area. */
const MODE_AREAS: Partial<Record<string, ToolArea[]>> = {
  reschedule_overdue: ["task_details"],
  weekly_review: ["goals", "insights"],
  goal_coach: ["goals"],
  sort_brainstorms: ["brainstorms"],
  connect_dots: ["goals", "brainstorms", "notes"],
};

const REFERENCE_AREAS: Record<string, ToolArea> = {
  task: "task_details",
  goal: "goals",
  reminder: "reminders",
  brainstorm: "brainstorms",
  note: "notes",
};

export function selectAreas(mode: string, text: string, referenceTypes: string[]) {
  const areas = new Set<ToolArea>(MODE_AREAS[mode] ?? []);
  for (const area of AREA_NAMES) if (AREA_KEYWORDS[area].test(text)) areas.add(area);
  for (const type of referenceTypes) if (REFERENCE_AREAS[type]) areas.add(REFERENCE_AREAS[type]);
  return areas;
}

const toolNames = (group: ToolGroup) => group.tools.flatMap((t) => t.functionDeclarations.map((d) => d.name));

const GROUP_BY_TOOL = new Map(
  [...CORE_GROUPS, ...Object.values(AREAS)].flatMap((group) => toolNames(group).map((name) => [name, group] as const)),
);

export function createToolbox(ctx: ToolContext, initialAreas: Set<ToolArea>) {
  const areas = new Set(initialAreas);

  return {
    getTools: () => [
      ...CORE_GROUPS.flatMap((g) => g.tools),
      ...[...areas].flatMap((area): ToolGroup["tools"] => AREAS[area].tools),
      ...(areas.size < AREA_NAMES.length ? LOAD_TOOLS : []),
    ],

    execute: async (name: string, args: any) => {
      if (name === "load_tools") {
        const requested: unknown[] = Array.isArray(args.areas) ? args.areas : [];
        requested.filter(isArea).forEach((area) => areas.add(area));
        return { loaded: [...areas] };
      }

      const group = GROUP_BY_TOOL.get(name);
      if (!group) return { error: `Unknown tool: ${name}` };
      try {
        return await group.execute(name, args, ctx);
      } catch (err) {
        // expected failures (not found, invalid value) tell the model what to fix
        if (err instanceof HttpError) return { error: err.message };
        throw err;
      }
    },
  };
}
