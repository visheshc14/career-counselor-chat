// src/db/schema.ts
import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),         // unique email
  name: text("name"),
  passwordHash: text("password_hash").notNull(),   // <-- must be NOT NULL for credentials auth
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("users_email_idx").on(t.email),
}));

// Keep `text` here so it supports both anon ids (string cookie) and real user uuids
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index("cs_user_idx").on(t.userId),
  createdIdx: index("cs_created_idx").on(t.createdAt),
}));

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  sessionIdx: index("msg_session_idx").on(t.sessionId),
  createdIdx: index("msg_created_idx").on(t.createdAt),
}));