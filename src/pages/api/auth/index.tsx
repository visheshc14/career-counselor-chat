// src/pages/auth/index.tsx
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import Head from "next/head";

export default function AuthLanding() {
  const router = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) || "/";

  // sign up state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suErr, setSuErr] = useState<string | null>(null);
  const [suBusy, setSuBusy] = useState(false);

  // sign in state
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");
  const [siErr, setSiErr] = useState<string | null>(null);
  const [siBusy, setSiBusy] = useState(false);

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (suBusy) return;
    setSuErr(null);
    setSuBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: suName, email: suEmail, password: suPass }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setSuErr(j?.error || "Failed to register");
        return;
      }
      const s = await signIn("credentials", {
        redirect: false,
        email: suEmail,
        password: suPass,
        callbackUrl,
      });
      if (s?.error) setSuErr(s.error);
      else router.push(callbackUrl);
    } finally {
      setSuBusy(false);
    }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (siBusy) return;
    setSiErr(null);
    setSiBusy(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: siEmail,
        password: siPass,
        callbackUrl,
      });
      if (res?.error) setSiErr(res.error);
      else router.push(callbackUrl);
    } finally {
      setSiBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Head><title>Sign in or Sign up · Career Counselor</title></Head>

      <main className="container py-10">
        <h1 className="text-2xl font-extrabold mb-6">Welcome to Career Counselor</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sign up */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">Create account</h2>
            {suErr && <div className="text-sm text-red-600 mb-2">{suErr}</div>}
            <form className="space-y-3" onSubmit={onSignUp}>
              <input
                className="input w-full"
                placeholder="Name (optional)"
                value={suName}
                onChange={(e) => setSuName(e.target.value)}
                autoComplete="name"
              />
              <input
                className="input w-full"
                placeholder="Email"
                type="email"
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className="input w-full"
                placeholder="Password"
                type="password"
                value={suPass}
                onChange={(e) => setSuPass(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button className="button w-full" type="submit" disabled={suBusy}>
                {suBusy ? "Creating…" : "Sign up"}
              </button>
            </form>
          </div>

          {/* Sign in */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">Sign in</h2>
            {siErr && <div className="text-sm text-red-600 mb-2">{siErr}</div>}
            <form className="space-y-3" onSubmit={onSignIn}>
              <input
                className="input w-full"
                placeholder="Email"
                type="email"
                value={siEmail}
                onChange={(e) => setSiEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                className="input w-full"
                placeholder="Password"
                type="password"
                value={siPass}
                onChange={(e) => setSiPass(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button className="button w-full" type="submit" disabled={siBusy}>
                {siBusy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}