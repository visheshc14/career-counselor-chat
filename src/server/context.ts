// src/server/context.ts
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";

import { getDb } from "@/lib/db";

// If you placed the NextAuth config elsewhere, update this import path:
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth"; // <-- make sure this file exists per earlier steps

const ANON_COOKIE = "anon_user_id";

function getOrSetAnonUser(req: NextApiRequest, res: NextApiResponse): string {
  const existing = req.cookies[ANON_COOKIE];
  if (existing) return existing;

  const id = randomUUID();

  // Long-lived cookie (2 years). Add Secure in production.
  const maxAge = 60 * 60 * 24 * 730;
  const parts = [
    `${ANON_COOKIE}=${id}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ];
  res.setHeader("Set-Cookie", parts.join("; "));
  return id;
}

export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  const db = getDb();

  // Try authenticated user first
  const session = await getServerSession(req, res, authOptions);
  const authUserId = (session?.user as any)?.id as string | undefined;

  // Fallback to anon cookie
  const anonId = getOrSetAnonUser(req, res);

  // Single id you can use everywhere (owned by auth user when present)
  const actorId = authUserId ?? anonId;

  return {
    db,
    session,          // full NextAuth session (or null)
    userId: authUserId ?? null,
    anonUserId: actorId, // backward-compat: previously used in routers
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
