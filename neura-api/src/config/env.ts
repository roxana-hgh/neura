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
};

// Origins allowed for CORS and Better Auth (local dev + deployed frontend)
export const allowedOrigins = ["http://localhost:5173", env.CORS_ORIGIN].filter(
  (origin): origin is string => Boolean(origin),
);
