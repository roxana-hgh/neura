export type ReminderRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type ReminderStatus = "active" | "paused" | "completed" | "cancelled";
export type ReminderView = "upcoming" | "snoozed" | "done" | "all";

/** All date-times are ISO strings (UTC). */
export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  scheduledAt: string; // current occurrence
  snoozedUntil: string | null;
  nextAt: string; // snoozedUntil ?? scheduledAt
  timeZone: string;
  repeat: ReminderRepeat;
  interval: number;
  weekdays: number[]; // 0 = Sunday … 6 = Saturday
  repeatUntil: string | null;
  status: ReminderStatus;
  suspendedBy: string | null; // "goal" = turned off by its goal
  completedAt: string | null;
  origin: "manual" | "goal_auto";
  autoKind: "review" | "checkin" | "deadline" | null;
  goalId: string | null;
  taskId: string | null;
  noteId: string | null;
  goal: { id: string; title: string; parentId: string | null; color: string } | null;
  task: { id: string; title: string; completed: boolean } | null;
  note: { id: string; title: string } | null;
  /** "done" view only: when this occurrence was marked done */
  doneAt?: string;
  doneScheduledAt?: string;
}

export interface ReminderCounts {
  overdue: number;
  today: number;
  snoozed: number;
}

export interface ReminderFilters {
  goalId?: string;
  taskId?: string;
  noteId?: string;
}

export type ReminderLinkType = "goal" | "task" | "note";

export interface ReminderLink {
  type: ReminderLinkType;
  id: string;
  title: string;
}

export interface ReminderLinkOptions {
  goals: { id: string; title: string; parentTitle: string | null }[];
  tasks: { id: string; title: string }[];
  notes: { id: string; title: string }[];
}

/** Body of POST /reminders and PATCH /reminders/:id (snake_case, as the API expects). */
export interface ReminderInput {
  title?: string;
  description?: string | null;
  scheduled_at?: string;
  time_zone?: string;
  repeat?: ReminderRepeat;
  interval?: number;
  weekdays?: number[];
  repeat_until?: string | null;
  goal_id?: string | null;
  task_id?: string | null;
  note_id?: string | null;
}
