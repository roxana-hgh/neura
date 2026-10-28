export type BrainstormStatus = "inbox" | "processed";

/** What a processed item became; null = dismissed */
export type BrainstormOutcome = "task" | "reminder" | null;

export interface Brainstorm {
  id: string;
  content: string;
  status: BrainstormStatus;
  /** Last time it was kept during a review; null = new since the last reset */
  reviewedAt: string | null;
  processedAt: string | null;
  convertedTo: BrainstormOutcome;
  task: { id: string; title: string; completed: boolean } | null;
  reminder: { id: string; title: string; nextAt: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** How a brainstorm is turned into something else */
export type ConvertKind = "task" | "reminder";

/** Daily reset = only new items; weekly reset = the whole inbox */
export type ReviewMode = "daily" | "weekly";
