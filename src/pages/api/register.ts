// src/pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const db = getDb();
  const lower = email.toLowerCase().trim();

  const exists = await db.query.users.findFirst({ where: eq(users.email, lower) });
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const [row] = await db
    .insert(users)
    .values({ email: lower, name: name?.trim() || null, passwordHash: hash })
    .returning();

  return res.status(201).json({ id: row.id, email: row.email });
}