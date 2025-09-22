// src/components/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ variant }: { variant: "home" | "app" }) {
  const { status } = useSession();
  const authed = status === "authenticated";
  const router = useRouter();

  return (
    <header className="border-b border-gray-200 dark:border-zinc-800">
      <div className="container py-3 flex items-center gap-3">
        <button
          className="text-lg font-bold"
          onClick={() => router.push("/")}
          aria-label="Go home"
        >
          Career Counselor
        </button>

        <div className="flex-1" />

        <ThemeToggle />

        {variant === "app" && authed ? (
          <button
            className="button-secondary ml-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        ) : null}
      </div>
    </header>
  );
}