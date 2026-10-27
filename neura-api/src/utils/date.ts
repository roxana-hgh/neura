import { format } from "date-fns";

/** Calendar-day key used for habit entries and streaks, e.g. "2026-02-04". */
export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
