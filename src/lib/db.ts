// src/lib/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Keep a single Drizzle instance across hot reloads / serverless
declare global {
  // eslint-disable-next-line no-var
  var __drizzle__: {
    db: PostgresJsDatabase<typeof schema>;
    client: ReturnType<typeof postgres>;
  } | undefined;
}

export function getDb() {
  if (globalThis.__drizzle__?.db) return globalThis.__drizzle__.db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const isLocal = /localhost|127\.0\.0\.1/.test(url) || /@db:/.test(url);
  const isNeon = /neon\.tech/.test(url);
  const needsSSL =
    /\bsslmode=require\b/i.test(url) || (!isLocal && !/@db:/.test(url));

  // For Neon/pgBouncer, prepared statements should be disabled
  const client = postgres(url, {
    ssl: needsSSL ? "require" : undefined,
    max: 1,                 // tiny pool works best with Next.js
    prepare: isNeon ? false : undefined,
  });

  const db = drizzle(client, { schema });
  globalThis.__drizzle__ = { db, client };
  return db;
}

// Optional: export the raw postgres client when needed elsewhere
export function getSql() {
  if (!globalThis.__drizzle__) getDb();
  return globalThis.__drizzle__!.client;
}