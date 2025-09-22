import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignIn() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  // Show success banner if we landed with ?registered=1, then remove the query param
  useEffect(() => {
    if (r.query.registered) {
      setJustRegistered(true);
      const { registered, ...rest } = r.query;
      r.replace({ pathname: r.pathname, query: rest }, undefined, { shallow: true }).catch(() => {});
    }
  }, [r]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.ok) {
        r.push("/chat");
      } else {
        setErr("Invalid email or password.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Sign in • Career Counselor</title></Head>
      <div className="min-h-screen flex items-center section-muted">
        <main className="container">
          <div className="mx-auto max-w-md">
            <div className="card p-6">
              {/* Header */}
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <span className="text-lg">🎓</span>
                </div>
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Sign in to your account
                </p>
              </div>

              {/* Success after signup */}
              {justRegistered && (
                <div className="mb-4 rounded-lg border px-3 py-2 text-sm
                                border-emerald-200 bg-emerald-50 text-emerald-800
                                dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-200">
                  ✅ Account created. You can sign in now.
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input pl-9 placeholder:text-xs"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉️</span>
                </div>

                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    className="input pl-9 placeholder:text-xs"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                </div>

                {err && <div className="text-xs text-red-600">{err}</div>}

                {/* PRIMARY submit now flips by theme */}
                <button
                  type="submit"
                  className="button-contrast w-full mt-1"
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">or</span>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>

              {/* Guest only */}
              <div className="grid">
                <button
                  type="button"
                  className="button-secondary w-full"
                  onClick={() => r.push("/chat")}
                  title="Skip for now (Anon mode)"
                >
                  Continue as guest
                </button>
              </div>

              {/* Footer */}
              <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
                Don’t have an account?{" "}
                <Link href="/auth/signup" className="underline decoration-dotted">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}