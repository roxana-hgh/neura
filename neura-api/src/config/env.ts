import "dotenv/config";

// Single place where process.env is read. Import `env` instead of touching process.env directly.
const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  NODE_ENV: nodeEnv,
  isProduction: nodeEnv === "production",
  PORT: process.env.PORT || 3000,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN, // deployed frontend
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  // Web Push (generate with `npx web-push generate-vapid-keys`). Push is off when unset.
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:admin@neura.app",
  // Lets an external scheduler call POST /api/notifications/dispatch (optional)
  CRON_SECRET: process.env.CRON_SECRET,
};

// Origins allowed for CORS and Better Auth (local dev + deployed frontend)
export const allowedOrigins = ["http://localhost:5173", env.CORS_ORIGIN].filter(
  (origin): origin is string => Boolean(origin),
);
