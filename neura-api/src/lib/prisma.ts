import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
