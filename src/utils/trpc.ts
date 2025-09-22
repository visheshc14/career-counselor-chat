import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers";

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`;
}

export function makeTrpcClient() {
  return {
    links: [
      loggerLink({
        enabled: (op) => process.env.NODE_ENV === "development" || (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        }
      }),
    ],
  };
}
