import { TZDate } from "@date-fns/tz";
import { addMinutes, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/modules/reminders/reminders.controller";
import * as reminders from "@/modules/reminders/reminders.service";
import { REMINDER_VIEWS, type ReminderView } from "@/modules/reminders/reminders.service";
import { REPEATS, zonedTime } from "@/modules/reminders/reminders.utils";
import { dayArg, localDateTime, type ToolContext } from "@/modules/assistant/tools/tool.utils";
import { HttpError, notFound } from "@/utils/http-error";

/** Assistant tools for reminders. The model works in the user's local time; the service stores UTC. */

const MAX_LISTED_REMINDERS = 30;
const DEFAULT_TIME = "09:00";

const SCHEDULE_FIELDS = {
  date: { type: "string", description: "Local date, yyyy-MM-dd." },
  time: { type: "string", description: "Local time, HH:mm. Default 09:00." },
  repeat: { type: "string", enum: REPEATS },
  interval: { type: "integer", description: "Every N days/weeks/months/years." },
  weekdays: { type: "array", items: { type: "integer" }, description: "Weekly only. 0 = Sunday … 6 = Saturday." },
  repeatUntil: { type: "string", description: "Last day of the series, yyyy-MM-dd." },
};

export const REMINDER_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "list_reminders",
        description: "The user's reminders, with times in their local zone.",
        parameters: {
          type: "object",
          properties: { view: { type: "string", enum: REMINDER_VIEWS, description: "Default upcoming." } },
        },
      },
      {
        name: "create_reminder",
        description: "Create a one-off or repeating reminder, optionally linked to one goal, task or note.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            ...SCHEDULE_FIELDS,
            goalId: { type: "string" },
            taskId: { type: "string" },
            noteId: { type: "string" },
          },
          required: ["title", "date"],
        },
      },
      {
        name: "update_reminder",
        description: "Edit or reschedule a reminder. Changing the schedule clears any snooze.",
        parameters: {
          type: "object",
          properties: {
            reminderId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            ...SCHEDULE_FIELDS,
          },
          required: ["reminderId"],
        },
      },
      {
        name: "reminder_action",
        description:
          "done: finish this occurrence (series moves on). stop: finish the whole series. skip: skip one occurrence. snooze: needs minutes. pause / resume / reopen.",
        parameters: {
          type: "object",
          properties: {
            reminderId: { type: "string" },
            action: { type: "string", enum: ["done", "stop", "skip", "snooze", "pause", "resume", "reopen"] },
            minutes: { type: "integer" },
          },
          required: ["reminderId", "action"],
        },
      },
      {
        name: "delete_reminder",
        description: "Permanently delete a reminder. Use only when the user clearly asks to.",
        parameters: {
          type: "object",
          properties: { reminderId: { type: "string" } },
          required: ["reminderId"],
        },
      },
    ],
  },
];

export async function executeReminderTool(name: string, args: any, ctx: ToolContext) {
  switch (name) {
    case "list_reminders":
      return listReminders(args, ctx);
    case "create_reminder":
      return createReminder(args, ctx);
    case "update_reminder":
      return updateReminder(args, ctx);
    case "reminder_action":
      return reminderAction(args, ctx);
    case "delete_reminder":
      return deleteReminder(args, ctx);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function parseTime(time: unknown) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time));
  const [hours, minutes] = match ? [Number(match[1]), Number(match[2])] : [NaN, NaN];
  if (!(hours <= 23 && minutes <= 59)) throw new HttpError(400, "time must be HH:mm");
  return { hours, minutes };
}

export function localMoment(day: string, time: string, timeZone: string) {
  const { hours, minutes } = parseTime(time);
  return zonedTime(day, hours, minutes, timeZone);
}

/** Repeat fields shared by create and update, in the REST body's names. */
function repeatBody(args: any, timeZone: string) {
  return {
    ...(args.repeat !== undefined && { repeat: args.repeat }),
    ...(args.interval !== undefined && { interval: args.interval }),
    ...(args.weekdays !== undefined && { weekdays: args.weekdays }),
    ...(args.repeatUntil !== undefined && {
      repeat_until: zonedTime(dayArg(args.repeatUntil, "repeatUntil"), 23, 59, timeZone).toISOString(),
    }),
  };
}

const whenLabel = (date: Date, timeZone: string) => format(new TZDate(date.getTime(), timeZone), "MMM d, HH:mm");

async function listReminders({ view = "upcoming" }: any, { userId, timeZone }: ToolContext) {
  if (!REMINDER_VIEWS.includes(view as ReminderView)) throw new HttpError(400, "Invalid view");
  const list = await reminders.listReminders(userId, { view });
  return {
    reminders: list.slice(0, MAX_LISTED_REMINDERS).map((r) => ({
      id: r.id,
      title: r.title,
      at: localDateTime(r.nextAt, r.timeZone ?? timeZone),
      repeat: r.repeat === "none" ? undefined : r.repeat,
      status: r.status,
      goal: r.goal?.title,
      task: r.task?.title,
      note: r.note?.title,
    })),
    total: list.length,
  };
}

/** Exported for brainstorms, which turn into reminders. */
export async function createReminder(args: any, { userId, timeZone }: ToolContext) {
  const scheduledAt = localMoment(dayArg(args.date, "date"), args.time ?? DEFAULT_TIME, timeZone);
  if (scheduledAt.getTime() <= Date.now()) throw new HttpError(400, "That time has already passed");

  const reminder = await reminders.createReminder(userId, parseBody({
    title: args.title,
    ...(args.description !== undefined && { description: args.description }),
    scheduled_at: scheduledAt.toISOString(),
    time_zone: timeZone,
    ...repeatBody(args, timeZone),
    ...((args.goalId || args.taskId || args.noteId) && {
      goal_id: args.goalId, task_id: args.taskId, note_id: args.noteId,
    }),
  }, true));

  return {
    created: { id: reminder.id, title: reminder.title, meta: whenLabel(reminder.nextAt, reminder.timeZone) },
  };
}

async function findOwned(userId: string, id: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!reminder) throw notFound("Reminder not found");
  return reminder;
}

async function updateReminder(args: any, { userId }: ToolContext) {
  const existing = await findOwned(userId, args.reminderId);
  const zone = existing.timeZone;

  // a new date keeps the old time of day, and the other way round
  const body: Record<string, unknown> = { ...repeatBody(args, zone) };
  if (args.title !== undefined) body.title = args.title;
  if (args.description !== undefined) body.description = args.description;
  if (args.date !== undefined || args.time !== undefined) {
    const [oldDay, oldTime] = localDateTime(existing.scheduledAt, zone).split(" ");
    const at = localMoment(args.date ? dayArg(args.date, "date") : oldDay, args.time ?? oldTime, zone);
    if (at.getTime() <= Date.now()) throw new HttpError(400, "That time has already passed");
    body.scheduled_at = at.toISOString();
  }

  const reminder = await reminders.updateReminder(userId, args.reminderId, parseBody(body, false));
  return { updated: { id: reminder.id, title: reminder.title, meta: whenLabel(reminder.nextAt, zone) } };
}

async function reminderAction({ reminderId, action, minutes }: any, { userId, timeZone }: ToolContext) {
  const run = () => {
    switch (action) {
      case "done": return reminders.completeReminder(userId, reminderId, "occurrence");
      case "stop": return reminders.completeReminder(userId, reminderId, "series");
      case "skip": return reminders.completeReminder(userId, reminderId, "occurrence", "skipped");
      case "pause": return reminders.setPaused(userId, reminderId, true);
      case "resume": return reminders.setPaused(userId, reminderId, false);
      case "reopen": return reminders.reopenReminder(userId, reminderId);
      case "snooze":
        if (!Number.isInteger(minutes) || minutes < 1) throw new HttpError(400, "snooze needs minutes");
        return reminders.snoozeReminder(userId, reminderId, addMinutes(new Date(), minutes));
      default: throw new HttpError(400, "Invalid action");
    }
  };

  const reminder = await run();
  return {
    updated: {
      id: reminderId,
      title: reminder?.title ?? "",
      meta: action === "snooze" && reminder ? `snoozed to ${whenLabel(reminder.nextAt, timeZone)}` : action,
    },
  };
}

async function deleteReminder({ reminderId }: any, { userId }: ToolContext) {
  const { title } = await findOwned(userId, reminderId);
  await reminders.deleteReminder(userId, reminderId);
  return { deleted: { id: reminderId, title } };
}
