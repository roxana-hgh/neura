import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { env, allowedOrigins } from "@/config/env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: allowedOrigins,
  advanced: {
    defaultCookieAttributes: env.isProduction
      ? { sameSite: "none", secure: true }
      : { sameSite: "lax", secure: false }, // localhost doesn't need/support Secure
  },
});
