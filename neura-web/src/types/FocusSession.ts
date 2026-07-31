export type FocusSessionTag = "work" | "personal" | "study" | "break" | "other";
export type DateRangeFilter = "today" | "week" | "month" | "all";

export interface FocusSession {
  id: string;
  name: string;
  description?: string | null;
  tag?: FocusSessionTag | null;
  duration: number; // seconds
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface CreateFocusSessionInput {
  name: string;
  description?: string;
  tag?: FocusSessionTag;
  duration: number;
  startTime: string;
  endTime: string;
}

export interface UpdateFocusSessionInput {
  name?: string;
  description?: string;
  tag?: FocusSessionTag;
}

export interface FocusSessionStats {
  totalDuration: number;
  sessionCount: number;
  byTag: Record<string, number>;
}


export interface FocusSessionListResponse {
  sessions: FocusSession[];
  total: number;
  hasMore: boolean;
}