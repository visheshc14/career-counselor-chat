import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

// Prefer .env.local in dev; fall back to .env; override any pre-set vars (e.g., from shell)
const envPath = existsSync(".env.local")
  ? ".env.local"
  : existsSync(".env")
  ? ".env"
  : undefined;

if (envPath) loadEnv({ path: envPath, override: true });
else loadEnv({ override: true });

// Support multiple names can keep Docker + Neon side-by-side.
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_NEON ||    // e.g. ...neon.tech/...&sslmode=require
  process.env.DATABASE_URL_LOCAL ||   // e.g. postgres://user:pass@localhost:5433/chatdb
  "";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Put your Neon URL in .env.local (include sslmode=require), " +
      "or use DATABASE_URL_NEON / DATABASE_URL_LOCAL."
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: DATABASE_URL }
} satisfies Config;