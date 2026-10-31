/** For each data-changing tool: the badge label, what to refresh, and where the item lives. */
interface ToolActionInfo {
  verb: string;
  queries: string[];
  path?: (id: string) => string;
}

const TASKS = ["tasks", "goals"];
const REMINDERS = ["reminders", "goals", "notifications"];
const taskPath = () => "/tasks";
const goalPath = (id: string) => `/goal/${id}`;
const notePath = (id: string) => `/note/${id}`;

export const TOOL_ACTIONS: Record<string, ToolActionInfo> = {
  create_task: { verb: "Added task", queries: TASKS, path: taskPath },
  update_task: { verb: "Updated task", queries: TASKS, path: taskPath },
  delete_task: { verb: "Deleted task", queries: TASKS },
  add_subtasks: { verb: "Broke down", queries: TASKS, path: taskPath },
  update_subtask: { verb: "Subtask", queries: TASKS, path: taskPath },
  bulk_update_tasks: { verb: "Updated", queries: TASKS, path: taskPath },
  create_task_list: { verb: "New list", queries: ["task-lists"], path: (id) => `/list/${id}` },

  create_habit: { verb: "New habit", queries: ["habits"], path: () => "/habits" },
  update_habit: { verb: "Updated habit", queries: ["habits"], path: () => "/habits" },
  delete_habit: { verb: "Deleted habit", queries: ["habits"] },
  log_habit_completion: { verb: "Habit", queries: ["habits"] },

  create_goal: { verb: "New goal", queries: ["goals", "reminders"], path: goalPath },
  update_goal: { verb: "Updated goal", queries: ["goals", "reminders"], path: goalPath },
  log_goal_progress: { verb: "Progress", queries: ["goals"], path: goalPath },
  add_goal_note: { verb: "Goal", queries: ["goals"], path: goalPath },
  set_goal_status: { verb: "Goal", queries: ["goals", "reminders"], path: goalPath },
  add_goal_tasks: { verb: "Goal", queries: TASKS, path: goalPath },
  link_to_goal: { verb: "Goal", queries: [...TASKS, "notes"], path: goalPath },
  delete_goal: { verb: "Deleted goal", queries: [...TASKS, "reminders"] },

  create_reminder: { verb: "Reminder set", queries: REMINDERS, path: () => "/reminders" },
  update_reminder: { verb: "Updated reminder", queries: REMINDERS, path: () => "/reminders" },
  reminder_action: { verb: "Reminder", queries: REMINDERS, path: () => "/reminders" },
  delete_reminder: { verb: "Deleted reminder", queries: REMINDERS },

  add_brainstorm: { verb: "Captured", queries: ["brainstorms"], path: () => "/brainstorms" },
  update_brainstorm: { verb: "Reworded idea", queries: ["brainstorms"], path: () => "/brainstorms" },
  sort_brainstorm: { verb: "Idea", queries: ["brainstorms", "tasks", ...REMINDERS], path: () => "/brainstorms" },
  delete_brainstorm: { verb: "Deleted idea", queries: ["brainstorms"] },

  create_note: { verb: "New note", queries: ["notes"], path: notePath },
  update_note: { verb: "Updated note", queries: ["notes"], path: notePath },
  delete_note: { verb: "Deleted note", queries: ["notes"] },

  log_focus_session: { verb: "Logged focus", queries: ["focus-sessions"], path: () => "/focus" },
};
