// src/pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";         // use your postgres-js drizzle helper
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const e = (email || "").toLowerCase().trim();
    const n = (name || "").trim();
    const p = (password || "").trim();

    if (!e || !p) return res.status(400).json({ ok: false, error: "Email and password required" });
    if (p.length < 8) return res.status(400).json({ ok: false, error: "Password must be at least 8 characters" });

    const db = getDb();

    // Check for existing email
    const existing = await db.query.users.findFirst({ where: eq(users.email, e) });
    if (existing) return res.status(409).json({ ok: false, error: "Email already in use" });

    // Hash & create
    const hash = await bcrypt.hash(p, 10);
    const [row] = await db
      .insert(users)
      .values({ email: e, name: n || null, passwordHash: hash })
      .returning();

    return res.status(201).json({ ok: true, id: row.id });
  } catch (err: any) {
    console.error("signup error:", err?.message ?? err);
    return res.status(500).json({ ok: false, error: "Server error. Please try again." });
  }
}