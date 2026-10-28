import type { Reminder } from "@/features/reminders/types/reminder";

export interface NotificationSettings {
  timeZone: string;
  reminders: boolean;
  taskDigest: boolean;
  taskDigestHour: number;
  taskNudge: boolean;
  taskNudgeHour: number;
  /** Devices subscribed to push for this account */
  devices: number;
  /** false when the server has no VAPID keys */
  pushAvailable: boolean;
}

export interface NotificationSettingsInput {
  reminders?: boolean;
  task_digest?: boolean;
  task_digest_hour?: number;
  task_nudge?: boolean;
  task_nudge_hour?: number;
  time_zone?: string;
}

export interface InboxTask {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  goalId: string | null;
  showInTasks: boolean;
}

export interface NotificationInbox {
  /** Active reminders that are due now (newest first) */
  reminders: Reminder[];
  tasks: { today: InboxTask[]; overdue: InboxTask[] };
}
