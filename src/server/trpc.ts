import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { ZodError } from "zod";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // In a real app you'd require auth; here we use anon user cookie.
  if (!ctx.anonUserId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next();
});
