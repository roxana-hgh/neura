import { prisma } from "@/lib/prisma";

// Public profile fields — never select auth-related columns here.
const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  age: true,
  job: true,
  gender: true,
  createdAt: true,
};

export interface ProfileUpdate {
  name?: string;
  age?: number | null;
  job?: string | null;
  gender?: string | null;
}

export function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

export function updateProfile(userId: string, { name, age, job, gender }: ProfileUpdate) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(age !== undefined && { age }),
      ...(job !== undefined && { job }),
      ...(gender !== undefined && { gender }),
    },
    select: profileSelect,
  });
}
