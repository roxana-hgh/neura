export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

export const TAG_LABELS: Record<string, string> = {
  work: "Work",
  personal: "Personal",
  study: "Study",
  break: "Break",
  other: "Other",
  untagged: "Untagged",
};

export const TAG_COLORS: Record<string, string> = {
  work: "bg-sky-500",
  personal: "bg-pink-500",
  study: "bg-amber-500",
  break: "bg-emerald-500",
  other: "bg-violet-400",
  untagged: "bg-neutral-500",
};

// src/lib/time.ts
export const TAG_BADGE_CLASSES: Record<string, string> = {
  work: "border-sky-500/40 text-sky-700 bg-sky-500/10 dark:text-sky-400",
  personal: "border-pink-500/40 text-pink-700 bg-pink-500/10 dark:text-pink-400",
  study: "border-emerald-500/40 text-emerald-700 bg-emerald-500/10 dark:text-emerald-400",
  break: "border-amber-500/40 text-amber-700 bg-amber-500/10 dark:text-amber-400",
  other: "border-violet-500/40 text-violet-700 bg-violet-500/10 dark:text-violet-400",
  untagged: "border-neutral-500/40 text-neutral-700 bg-neutral-500/10 dark:text-neutral-400",
};
export function formatDurationClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}