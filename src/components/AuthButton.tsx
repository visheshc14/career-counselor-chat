// src/components/AuthButton.tsx
import { signOut } from "next-auth/react";
export function SignOutButton() {
  return <button className="button" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>Sign out</button>;
}
