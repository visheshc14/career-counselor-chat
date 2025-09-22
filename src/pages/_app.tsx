import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, makeTrpcClient } from "@/utils/trpc";
import { ThemeToggle } from "@/components/ThemeToggle";

type MyPageProps = { session?: Session | null };

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, staleTime: 15_000 },
        },
      })
  );
  const [trpcClient] = useState(() => trpc.createClient(makeTrpcClient()));
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

/** Inactivity watcher:
 * - Runs when authenticated (outside /auth/*)
 * - 2 min idle ⇒ sign out + redirect with ?expired=1
 */
function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiringRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      expiringRef.current = false;
      return;
    }

    if (router.pathname.startsWith("/auth")) return;

    const INACTIVITY_MS = 2 * 60 * 1000;

    const resetTimer = () => {
      if (expiringRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (expiringRef.current) return;
        expiringRef.current = true;
        try {
          await signOut({ redirect: false });
        } finally {
          router.push("/?expired=1").catch(() => {});
        }
      }, INACTIVITY_MS);
    };

    const onActivity = () => {
      if (document.hidden) return;
      resetTimer();
    };

    const winEvents: Array<keyof WindowEventMap> = [
      "mousemove","mousedown","keydown","scroll","touchstart","pointerdown",
    ];
    winEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const onVis = () => { if (!document.hidden) resetTimer(); };
    document.addEventListener("visibilitychange", onVis);

    resetTimer();

    return () => {
      winEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener("visibilitychange", onVis);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      expiringRef.current = false;
    };
  }, [status, router.pathname, router]);

  return null;
}

export default function App({ Component, pageProps }: AppProps<MyPageProps>) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <Providers>
        <SessionWatcher />
        {/* Page */}
        <Component {...rest} />
        {/* Global theme toggle */}
        <div className="fixed right-4 bottom-4 z-[999]">
          <ThemeToggle />
        </div>
      </Providers>
    </SessionProvider>
  );
}