import { prisma } from "@/lib/prisma";
import type { WeekStartsOn } from "@/utils/date";

// Public profile fields — never select auth-related columns here.
const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  age: true,
  job: true,
  gender: true,
  weekStartsOn: true,
  assistantInstructions: true,
  createdAt: true,
};

// Sent with every assistant request, so it's capped well below the model's token budget.
export const MAX_ASSISTANT_INSTRUCTIONS = 1000;

export interface ProfileUpdate {
  name?: string;
  age?: number | null;
  job?: string | null;
  gender?: string | null;
  weekStartsOn?: WeekStartsOn;
  assistantInstructions?: string | null;
}

export function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

export function updateProfile(
  userId: string,
  { name, age, job, gender, weekStartsOn, assistantInstructions }: ProfileUpdate,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(age !== undefined && { age }),
      ...(job !== undefined && { job }),
      ...(gender !== undefined && { gender }),
      ...(weekStartsOn !== undefined && { weekStartsOn }),
      ...(assistantInstructions !== undefined && {
        assistantInstructions: assistantInstructions?.trim() || null,
      }),
    },
    select: profileSelect,
  });
}
