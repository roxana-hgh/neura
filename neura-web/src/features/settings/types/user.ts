import type { WeekStartsOn } from "@/lib/weekStart";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  age: number | null;
  job: string | null;
  gender: string | null;
  weekStartsOn: WeekStartsOn;
  createdAt: string;
}

export type UpdateProfilePayload = Partial<
  Pick<User, "name" | "age" | "job" | "gender">
>;