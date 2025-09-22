// src/server/routers/index.ts
import { router } from "../trpc";
import { chatRouter } from "./chat";

export const appRouter = router({
  chat: chatRouter,
});

// Inference-friendly type for the whole API
export type AppRouter = typeof appRouter;

// SSR/unit-test friendly server-side caller
export const createCaller = appRouter.createCaller;
