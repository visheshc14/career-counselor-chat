import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function SignUp() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      // Replace with your real sign-up endpoint if using Credentials:
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        r.push("/auth/signin?registered=1");
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error ?? "Could not create account.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Sign up • Career Counselor</title></Head>
      <div className="min-h-screen flex items-center section-muted">
        <main className="container">
          <div className="mx-auto max-w-md">
            <div className="card p-6">
              {/* Header */}
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <span className="text-lg">✨</span>
                </div>
                <h1 className="text-2xl font-semibold">Create your account</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  It only takes a moment
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Name
                </label>
                <div className="relative">
                  <input
                    className="input pl-9 placeholder:text-xs"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                </div>

                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input pl-9 placeholder:text-xs"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {busy ? "Creating…" : "Create account"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400">or</span>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>

              {/* Secondary actions */}
              <div className="grid gap-2">
                <button
                  type="button"
                  className="button-secondary w-full"
                  onClick={() => (window.location.href = "/auth/signin")}
                >
                  Sign in instead
                </button>
                <button
                  type="button"
                  className="button-secondary w-full"
                  onClick={() => (window.location.href = "/chat")}
                  title="Skip for now (Anon mode)"
                >
                  Continue as guest
                </button>
              </div>

              {/* Footer */}
              <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{" "}
                <span className="underline decoration-dotted">Terms</span> &{" "}
                <span className="underline decoration-dotted">Privacy</span>.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}