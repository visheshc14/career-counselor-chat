import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/server/routers";
import { createContext } from "@/server/context";

export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error, type, path }) {
    console.error("tRPC error", { type, path, error });
  }
});
