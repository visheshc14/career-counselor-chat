// src/server/routers/chat.ts
import { router, authedProcedure } from "../trpc";
import { z } from "zod";
import { chatSessions, messages } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ---- LLM caller ----
async function callLLM(prompt: string): Promise<string> {
  const system =
    "You are a friendly, practical career counselor. Give concise, step-by-step, actionable advice. Ask up to 2 clarifying questions if needed.";

  const orKey = process.env.OPENROUTER_API_KEY;
  const primaryModel = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";
  const altModels =
    process.env.OPENROUTER_ALT_MODELS?.split(",").map(s => s.trim()).filter(Boolean) ?? [
      "deepseek/deepseek-chat",
      "meta-llama/llama-3.1-8b-instruct:free",
      "google/gemma-2-9b-it:free",
      "mistralai/mistral-7b-instruct:free",
    ];
  const appUrl = process.env.APP_URL || "https://github.com/your/repo";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Career Counselor";

  const tryPost = async (url: string, headers: Record<string,string>, body: unknown) => {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        // @ts-ignore Node 20
        signal: typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(30_000) : undefined,
      });
      const text = await resp.text();
      return { ok: resp.ok, status: resp.status, text };
    } catch (e: any) {
      return { ok: false, status: 0, text: e?.message ?? String(e) };
    }
  };

  const parse = (raw: string): string | null => {
    try {
      const j: any = JSON.parse(raw);
      const out = j?.choices?.[0]?.message?.content;
      return typeof out === "string" && out.trim() ? out : null;
    } catch { return null; }
  };

  if (orKey) {
    const headers: Record<string,string> = {
      Authorization: `Bearer ${orKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": appName,
      Accept: "application/json",
    };
    const models = [primaryModel, ...altModels];
    for (let i = 0; i < models.length; i++) {
      const r = await tryPost("https://openrouter.ai/api/v1/chat/completions", headers, {
        model: models[i],
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      });
      if (r.ok) return parse(r.text) ?? "The model returned no text. Try rephrasing.";
      if (r.status === 429) await new Promise(res => setTimeout(res, 400 * Math.pow(1.6, i)));
    }
  }

  const openKey = process.env.OPENAI_API_KEY;
  if (openKey) {
    const headers: Record<string,string> = { Authorization: `Bearer ${openKey}`, "Content-Type": "application/json" };
    if (process.env.OPENAI_PROJECT) headers["OpenAI-Project"] = process.env.OPENAI_PROJECT;
    const r = await tryPost("https://api.openai.com/v1/chat/completions", headers, {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
    });
    if (r.ok) return parse(r.text) ?? "The model returned no text. Try rephrasing.";
  }

  return "Free models are temporarily busy. Tell me your current role, the skills you enjoy, and 2–3 target roles; I’ll outline a step-by-step plan.";
}

/* -----------------------------------------
   Minimal, in-memory rate limit per user/ip
   (8 actions every 10s). No new dependency.
------------------------------------------ */
const rl = new Map<string, { count: number; resetAt: number }>();
function allow(key: string, limit = 8, windowMs = 10_000) {
  const now = Date.now();
  const rec = rl.get(key);
  if (!rec || now > rec.resetAt) {
    rl.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count += 1;
  return true;
}

/* -----------------------------------------
   Ensure the session belongs to the caller
------------------------------------------ */
async function assertOwnsSession(db: any, userId: string, sessionId: string) {
  const rows = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);
  if (!rows?.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }
}

export const chatRouter = router({
  // List sessions for current anon/auth user
  listSessions: authedProcedure
    .input(z.object({ page: z.number().min(1).default(1), pageSize: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const { db, anonUserId } = ctx;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      return await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, anonUserId))
        .orderBy(desc(chatSessions.createdAt))
        .limit(pageSize)
        .offset(offset);
    }),

  // LEFT sidebar "New" → just create (additive)
  createSession: authedProcedure
    .input(z.object({ title: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const { db, anonUserId } = ctx;
      const [row] = await db.insert(chatSessions).values({
        title: input.title.trim(),
        userId: anonUserId,
      }).returning();
      return row;
    }),

  // HEADER "New Session" → wipe ALL sessions/messages for this user, then create one fresh
  wipeAndCreate: authedProcedure
    .input(z.object({ title: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const { db, anonUserId } = ctx;

      const fresh = await db.transaction(async (tx: any) => {
        const existing = await tx
          .select({ id: chatSessions.id })
          .from(chatSessions)
          .where(eq(chatSessions.userId, anonUserId));

        const ids = existing.map((r: any) => r.id);
        if (ids.length) {
          await tx.delete(messages).where(inArray(messages.sessionId, ids));     // delete children first
          await tx.delete(chatSessions).where(inArray(chatSessions.id, ids));    // then parents
        }

        const [row] = await tx
          .insert(chatSessions)
          .values({ title: input.title.trim(), userId: anonUserId })
          .returning();

        return row!;
      });

      return fresh;
    }),

  // Messages (ownership + optional limit)
  getMessages: authedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      limit: z.number().min(1).max(500).default(200),
    }))
    .query(async ({ ctx, input }) => {
      const { db, anonUserId } = ctx;

      await assertOwnsSession(db, anonUserId, input.sessionId);

      return await db
        .select()
        .from(messages)
        .where(eq(messages.sessionId, input.sessionId))
        .orderBy(messages.createdAt) // ascending for UI
        .limit(input.limit);
    }),

  // Send message (ownership + rate-limit)
  sendMessage: authedProcedure
    .input(z.object({ sessionId: z.string().uuid(), content: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const { db, anonUserId, req } = ctx as any;

      await assertOwnsSession(db, anonUserId, input.sessionId);

      const key = `send:${anonUserId || req?.ip || "x"}`;
      if (!allow(key)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please slow down." });
      }

      const [userMsg] = await db.insert(messages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.content,
      }).returning();

      // Call model (best-effort), never throw raw provider errors
      let aiText: string;
      try {
        aiText = await callLLM(input.content);
      } catch {
        aiText = "I hit a temporary issue reaching the model. Try again in a moment.";
      }

      const [aiMsg] = await db.insert(messages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: aiText,
      }).returning();

      return { user: userMsg, assistant: aiMsg };
    }),
});