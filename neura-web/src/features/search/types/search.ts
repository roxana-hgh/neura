export type SearchType = "tasks" | "goals" | "notes" | "reminders" | "habits" | "brainstorms" | "lists";

export interface SearchResponse {
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
    dueDate: string | null;
    snippet: string;
    list: { id: string; name: string; color: string } | null;
    goal: { id: string; title: string } | null;
  }[];
  goals: {
    id: string;
    title: string;
    status: "active" | "paused" | "completed" | "cancelled";
    color: string;
    archivedAt: string | null;
    snippet: string;
    parent: { id: string; title: string } | null;
  }[];
  notes: { id: string; title: string; color: string; updatedAt: string; snippet: string }[];
  reminders: {
    id: string;
    title: string;
    nextAt: string;
    timeZone: string;
    status: "active" | "paused" | "done";
    repeat: string;
    snippet: string;
  }[];
  habits: { id: string; title: string; color: string; isArchived: boolean }[];
  brainstorms: { id: string; content: string; status: "inbox" | "processed"; createdAt: string }[];
  lists: { id: string; name: string; color: string; taskCount: number }[];
}

/** One row in the palette, whatever its type. */
export interface SearchItem {
  key: string;
  type: SearchType;
  id: string;
  title: string;
  /** Matched text, shown under the title with the query highlighted. */
  snippet?: string;
  /** Short context on the right (date, status, list). */
  meta?: string;
  /** Where Enter goes. Tasks open their detail dialog instead. */
  href?: string;
  done?: boolean;
}
