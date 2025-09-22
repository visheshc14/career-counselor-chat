// src/server/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // required in prod

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    // newUser is only used by OAuth providers; it's fine to keep or remove.
    newUser: "/auth/signup",
  },

  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email?.toLowerCase().trim();
        const password = (creds?.password ?? "").trim();
        if (!email || !password) return null;

        const db = getDb();

        // Portable Drizzle query (works whether or not you generated `db.query.users`)
        const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
        const row = rows[0];
        if (!row?.passwordHash) return null;

        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) return null;

        // Return minimal user object; NextAuth will embed into the JWT
        return {
          id: row.id,
          email: row.email,
          name: row.name ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    // Put the DB user id on the token
    async jwt({ token, user }) {
      if (user?.id) {
        (token as any).uid = user.id;
      }
      return token;
    },

    // Expose it on the session for client-side access
    async session({ session, token }) {
      if (session.user && (token as any).uid) {
        (session.user as any).id = (token as any).uid as string;
      }
      return session;
    },
  },

  // Helpful while wiring things up
  debug: process.env.NODE_ENV === "development",
};