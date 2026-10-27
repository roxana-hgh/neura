import { CircleCheckBig, StickyNote, Target } from "lucide-react";
import type { ReminderLinkType } from "@/features/reminders/types/reminder";

export const LINK_ICONS: Record<ReminderLinkType, typeof Target> = {
  goal: Target,
  task: CircleCheckBig,
  note: StickyNote,
};
