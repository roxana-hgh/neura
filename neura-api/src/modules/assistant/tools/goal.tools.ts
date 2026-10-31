import { parseBody } from "@/modules/goals/goals.controller";
import * as goals from "@/modules/goals/goals.service";
import { GOAL_METRICS, GOAL_PERIODS, GOAL_STATUSES, REMINDER_PRESETS, type GoalStatus } from "@/modules/goals/goals.utils";
import { clip, dayArg, requiredText, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { HttpError } from "@/utils/http-error";

/** Assistant tools for goals. Everything goes through the goals service, so reminders stay in sync. */

const MAX_SUB_GOALS = 10;
const MAX_GOAL_TASKS = 15;

// Field names match the REST body, so validation is shared with the goals controller
const GOAL_FIELDS = {
  title: { type: "string" },
  period: { type: "string", enum: GOAL_PERIODS },
  start_date: { type: "string", description: "yyyy-MM-dd. Defaults from the period." },
  end_date: { type: "string", description: "yyyy-MM-dd. Defaults from the period." },
  metric: {
    type: "string",
    enum: GOAL_METRICS,
    description: "numeric: start→target value. milestone: average of sub-goals. task: linked tasks done. manual: self-rated 0–100.",
  },
  start_value: { type: "number" },
  target_value: { type: "number" },
  unit: { type: "string" },
  success_criteria: { type: "string", description: "How the user will know it's done. Max 300 chars." },
  description: { type: "string" },
  category: { type: "string" },
};
const GOAL_FIELD_NAMES = Object.keys(GOAL_FIELDS);

export const GOAL_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_goals",
        description: "The user's top-level goals with progress, pace and whether they need review.",
        parameters: {
          type: "object",
          properties: { archived: { type: "boolean", description: "Archived goals instead." } },
        },
      },
      {
        name: "get_goal",
        description: "One goal or sub-goal in full: sub-goals, tasks, notes, recent history, next reminder.",
        parameters: {
          type: "object",
          properties: { goalId: { type: "string" } },
          required: ["goalId"],
        },
      },
      {
        name: "create_goal",
        description:
          "Create a goal, or a sub-goal with parentId. For a big goal, propose sub-goals and pass them as subGoals.",
        parameters: {
          type: "object",
          properties: {
            ...GOAL_FIELDS,
            parentId: { type: "string", description: "Makes this a sub-goal. One level only." },
            subGoals: { type: "array", items: { type: "string" }, description: "Sub-goal titles to create." },
            reminderPresets: {
              type: "array",
              items: { type: "string", enum: REMINDER_PRESETS },
              description: "review: weekly. checkin: monthly. deadline: shortly before the end.",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "update_goal",
        description: "Edit a goal. Moving end_date extends it and moves its reminders too.",
        parameters: {
          type: "object",
          properties: { goalId: { type: "string" }, ...GOAL_FIELDS },
          required: ["goalId"],
        },
      },
      {
        name: "log_goal_progress",
        description:
          "Record progress on a numeric or manual goal, as the new value or a delta. Other goals get progress from sub-goals or tasks.",
        parameters: {
          type: "object",
          properties: {
            goalId: { type: "string" },
            value: { type: "number" },
            delta: { type: "number" },
            note: { type: "string" },
          },
          required: ["goalId"],
        },
      },
      {
        name: "add_goal_note",
        description: "Add an entry to a goal's journal: a reflection, a decision, a piece of feedback.",
        parameters: {
          type: "object",
          properties: { goalId: { type: "string" }, note: { type: "string" } },
          required: ["goalId", "note"],
        },
      },
      {
        name: "set_goal_status",
        description:
          "Pause, resume (active), complete or cancel a goal, or archive it. Pausing, completing and cancelling turn off its reminders. Never complete or cancel without the user saying so.",
        parameters: {
          type: "object",
          properties: {
            goalId: { type: "string" },
            status: { type: "string", enum: GOAL_STATUSES },
            archived: { type: "boolean" },
            note: { type: "string" },
          },
          required: ["goalId"],
        },
      },
      {
        name: "add_goal_tasks",
        description: "Create the next concrete steps of a goal as tasks linked to it.",
        parameters: {
          type: "object",
          properties: {
            goalId: { type: "string" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  dueDate: { type: "string", description: "yyyy-MM-dd." },
                },
                required: ["title"],
              },
            },
            onlyOnGoal: { type: "boolean", description: "Hide them from the Tasks page and calendar." },
          },
          required: ["goalId", "tasks"],
        },
      },
      {
        name: "link_to_goal",
        description: "Link an existing task or note to a goal, or unlink it.",
        parameters: {
          type: "object",
          properties: {
            goalId: { type: "string" },
            type: { type: "string", enum: ["task", "note"] },
            targetId: { type: "string" },
            unlink: { type: "boolean" },
          },
          required: ["goalId", "type", "targetId"],
        },
      },
      {
        name: "delete_goal",
        description:
          "Permanently delete a goal and its sub-goals; tasks and notes stay. Only after the user confirmed it in this chat.",
        parameters: {
          type: "object",
          properties: {
            goalId: { type: "string" },
            deleteReminders: { type: "boolean", description: "Also delete manual reminders. Default false." },
          },
          required: ["goalId"],
        },
      },
    ],
  },
];

export async function executeGoalTool(name: string, args: any, ctx: ToolContext) {
  switch (name) {
    case "list_goals":
      return listGoals(args, ctx);
    case "get_goal":
      return getGoal(args, ctx);
    case "create_goal":
      return createGoal(args, ctx);
    case "update_goal":
      return updateGoal(args, ctx);
    case "log_goal_progress":
      return logProgress(args, ctx);
    case "add_goal_note":
      return addNote(args, ctx);
    case "set_goal_status":
      return setStatus(args, ctx);
    case "add_goal_tasks":
      return addTasks(args, ctx);
    case "link_to_goal":
      return linkToGoal(args, ctx);
    case "delete_goal":
      return deleteGoal(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

type GoalRow = Awaited<ReturnType<typeof goals.getGoal>>;

const pickGoalFields = (args: any) =>
  Object.fromEntries(GOAL_FIELD_NAMES.filter((k) => args[k] !== undefined).map((k) => [k, args[k]]));

const goalValue = (g: Pick<GoalRow, "metric" | "currentValue" | "targetValue" | "unit">) =>
  g.metric === "numeric" ? `${g.currentValue}/${g.targetValue ?? "?"}${g.unit ? ` ${g.unit}` : ""}` : undefined;

async function listGoals({ archived }: any, { userId, todayKey }: ToolContext) {
  const list = await goals.listGoals(userId, !!archived, todayKey);
  return {
    goals: list.map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      metric: g.metric,
      value: goalValue(g),
      progress: g.progress,
      expectedProgress: g.expectedProgress,
      pace: g.pace,
      needsReview: g.needsReview,
      endDate: g.endDate,
      category: g.category,
      counts: g.counts,
    })),
  };
}

async function getGoal({ goalId }: any, { userId, todayKey }: ToolContext) {
  const g = await goals.getGoal(userId, goalId, todayKey);
  return {
    goal: {
      id: g.id,
      title: g.title,
      parent: g.parent,
      status: g.status,
      period: g.period,
      startDate: g.startDate,
      endDate: g.endDate,
      metric: g.metric,
      value: goalValue(g),
      progress: g.progress,
      expectedProgress: g.expectedProgress,
      pace: g.pace,
      needsReview: g.needsReview,
      successCriteria: g.successCriteria,
      description: g.description,
      subGoals: g.subGoals.map((s) => ({ id: s.id, title: s.title, status: s.status, progress: s.progress })),
      tasks: g.tasks.slice(0, 15).map((t) => ({
        id: t.id, title: t.title, completed: t.completed, priority: t.priority, dueDate: t.dueDate,
      })),
      notes: g.notes.slice(0, 8).map((n) => ({ id: n.id, title: n.title })),
      nextReminder: g.nextReminder,
      history: g.logs.slice(0, 8).map((l) => ({
        type: l.type, value: l.value, note: l.note && clip(l.note, 200), at: l.createdAt.toISOString().slice(0, 10),
      })),
    },
  };
}

async function createGoal(args: any, { userId, todayKey, timeZone }: ToolContext) {
  const subGoals: string[] = (args.subGoals ?? []).map((t: unknown) => requiredText(t, "Sub-goal title", 120));
  if (subGoals.length > MAX_SUB_GOALS) throw new HttpError(400, `At most ${MAX_SUB_GOALS} sub-goals at once`);

  const body = {
    ...pickGoalFields(args),
    ...(args.parentId && { parent_id: args.parentId }),
    ...(args.reminderPresets?.length && { reminder_presets: args.reminderPresets, time_zone: timeZone }),
  };
  const goal = await goals.createGoal(userId, parseBody(body, true), todayKey);

  // sequential, so they keep the order the model gave them (`position` is a count)
  for (const title of subGoals) {
    await goals.createGoal(userId, { title, parentId: goal.id }, todayKey);
  }

  return {
    created: {
      id: goal.id,
      title: goal.title,
      meta: subGoals.length ? `${subGoals.length} sub-goals` : `until ${goal.endDate}`,
    },
  };
}

async function updateGoal(args: any, { userId, todayKey }: ToolContext) {
  const goal = await goals.updateGoal(userId, args.goalId, parseBody(pickGoalFields(args), false), todayKey);
  return { updated: { id: goal.id, title: goal.title } };
}

async function logProgress({ goalId, value, delta, note }: any, { userId, todayKey }: ToolContext) {
  if (typeof value !== "number" && typeof delta !== "number") throw new HttpError(400, "value or delta is required");
  const goal = await goals.recordProgress(userId, goalId, { value, delta, note: note?.slice(0, 500) }, todayKey);
  return { updated: { id: goal.id, title: goal.title, meta: `${goal.progress}%` } };
}

async function addNote({ goalId, note }: any, { userId, todayKey }: ToolContext) {
  const goal = await goals.addNote(userId, goalId, requiredText(note, "Note", 1000), todayKey);
  return { updated: { id: goal.id, title: goal.title, meta: "journal entry" } };
}

async function setStatus({ goalId, status, archived, note }: any, { userId, todayKey }: ToolContext) {
  if (status !== undefined && !GOAL_STATUSES.includes(status as GoalStatus)) throw new HttpError(400, "Invalid status");
  if (status === undefined && typeof archived !== "boolean") throw new HttpError(400, "status or archived is required");

  let goal = await goals.getGoal(userId, goalId, todayKey);
  if (status) goal = await goals.setStatus(userId, goalId, status, [], note?.slice(0, 500) ?? null, todayKey);
  if (typeof archived === "boolean") goal = await goals.setArchived(userId, goalId, archived, todayKey);
  return { updated: { id: goal.id, title: goal.title, meta: typeof archived === "boolean" ? (archived ? "archived" : "restored") : status } };
}

async function addTasks({ goalId, tasks, onlyOnGoal }: any, { userId, todayKey }: ToolContext) {
  if (!Array.isArray(tasks) || tasks.length === 0) throw new HttpError(400, "tasks is required");
  if (tasks.length > MAX_GOAL_TASKS) throw new HttpError(400, `At most ${MAX_GOAL_TASKS} tasks at once`);

  const goal = await goals.getGoal(userId, goalId, todayKey);
  for (const task of tasks) {
    await goals.createTask(userId, goalId, {
      title: requiredText(task.title, "Title", 200),
      priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : undefined,
      dueDate: task.dueDate ? dayArg(task.dueDate, "dueDate") : null,
      // asked for in chat, so the user expects to find them in Tasks too
      showInTasks: !onlyOnGoal,
    });
  }
  return { updated: { id: goal.id, title: goal.title, meta: `+${tasks.length} tasks` } };
}

async function linkToGoal({ goalId, type, targetId, unlink }: any, { userId, todayKey }: ToolContext) {
  if (type !== "task" && type !== "note") throw new HttpError(400, "type must be task or note");
  await goals.link(userId, goalId, type, targetId, !unlink);
  const goal = await goals.getGoal(userId, goalId, todayKey);
  return { updated: { id: goal.id, title: goal.title, meta: `${type} ${unlink ? "unlinked" : "linked"}` } };
}

async function deleteGoal({ goalId, deleteReminders }: any, { userId, todayKey }: ToolContext) {
  const goal = await goals.getGoal(userId, goalId, todayKey);
  await goals.deleteGoal(userId, goalId, !deleteReminders);
  return { deleted: { id: goal.id, title: goal.title } };
}
