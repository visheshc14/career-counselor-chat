import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const router = useRouter();

  // One-time banners
  const [justSignedOut, setJustSignedOut] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    // Read from query and from actual URL (SSR / hard refresh safe)
    const q = router.query ?? {};
    const sp =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

    const hasSignout =
      "signout" in q || sp?.has("signout") ||
      // Fallback: if we arrived unauthenticated from /chat, treat as sign-out
      (!authed && typeof document !== "undefined" && /\/chat(\/|$)/.test(document.referrer));

    const hasRegistered = "registered" in q || sp?.has("registered");
    const hasExpired = "expired" in q || sp?.has("expired");

    if (hasSignout) setJustSignedOut(true);
    if (hasRegistered) setJustRegistered(true);
    if (hasExpired) setSessionExpired(true);

    // Clean URL so messages are one-time
    if (hasSignout || hasRegistered || hasExpired) {
      if (typeof window !== "undefined" && window.history?.replaceState) {
        window.history.replaceState({}, "", router.pathname);
      } else {
        const clean = { ...router.query };
        delete (clean as any).signout;
        delete (clean as any).registered;
        delete (clean as any).expired;
        router.replace({ pathname: router.pathname, query: clean }, undefined, { shallow: true }).catch(() => {});
      }
    }
  }, [router.isReady, authed, router.pathname, router.query]);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden section-muted">
      <Head>
        <title>Career Counselor</title>
        <meta
          name="description"
          content="Practical, no-fluff guidance to pick a target role, close skill gaps, and land interviews."
        />
      </Head>

      {/* Soft dotted background (body already has dots, this is a helper to ensure coverage if needed) */}
      <div className="pointer-events-none absolute inset-0 bg-dots" aria-hidden />

      {/* Gentle gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 h-[28rem] w-[28rem] rounded-full
                   bg-gradient-to-br from-black/10 to-transparent blur-3xl dark:from-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full
                   bg-gradient-to-br from-black/5 to-transparent blur-3xl dark:from-white/10"
      />

      <main className="container relative">
        <div className="mx-auto max-w-3xl">
          {/* Hero card */}
          <div className="card p-8 md:p-10 text-center">
            {/* Mark */}
            <div className="mx-auto mb-6 h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/10
                            flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
              <span className="text-xl">🎓</span>
            </div>

            {/* Headline */}
            <h1 className="hero-title text-4xl md:text-5xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-br
                               from-black to-black/70 dark:from-white dark:to-white/70">
                Career Counselor
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
              Practical, no-fluff guidance to pick a target role, close skill gaps,
              and land interviews—faster.
            </p>

            {/* Banners */}
            <div className="mt-5 space-y-2 mx-auto w-full max-w-md text-left">
              {sessionExpired && (
                <div className="rounded-lg border px-3 py-2 text-sm
                                border-amber-200 bg-amber-50 text-amber-800
                                dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100">
                  ⏱️ Your session expired due to inactivity. Please sign in again.
                </div>
              )}
              {justSignedOut && !authed && (
                <div className="rounded-lg border px-3 py-2 text-sm
                                border-emerald-200 bg-emerald-50 text-emerald-800
                                dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-100">
                  ✅ You’ve signed out. To use the app, please sign in.
                </div>
              )}
              {justRegistered && (
                <div className="rounded-lg border px-3 py-2 text-sm
                                border-sky-200 bg-sky-50 text-sky-800
                                dark:border-sky-700/50 dark:bg-sky-900/20 dark:text-sky-100">
                  🎉 Account created! You can sign in now.
                </div>
              )}
            </div>

            {/* CTA (both buttons flip by theme) */}
            {!authed ? (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/signin" className="button-contrast">Sign in</Link>
                <Link href="/auth/signup" className="button-contrast">Sign up</Link>
              </div>
            ) : (
              <div className="mt-7 flex items-center justify-center gap-3">
                <Link href="/chat" className="button-contrast">Go to App</Link>
              </div>
            )}

            {/* Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="badge">No fluff</span>
              <span className="badge">Actionable steps</span>
              <span className="badge">Built for clarity</span>
            </div>

            {/* Signed-in hint */}
            {authed && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Signed in as{" "}
                <span className="font-medium">
                  {session?.user?.name || session?.user?.email}
                </span>
                .
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Made by <span className="font-medium">Vishesh</span>
          </p>
        </div>
      </main>
    </div>
  );
}