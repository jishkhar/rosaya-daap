"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { call } from "@/lib/http";

const input = "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

/** "Forgot password" (ask for a link) and "Reset password" (use the emailed token), one card each. */
export function PasswordRecovery({ mode }: { mode: "forgot" | "reset" }) {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "forgot" && !/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (mode === "reset" && password.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    const r = mode === "forgot"
      ? await call("/api/auth/forgot", { method: "POST", body: { email: email.trim() } })
      : await call("/api/auth/reset", { method: "POST", body: { token, password } });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (mode === "forgot") setSent(true);
    else router.push("/login?reset=1");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <h1 className="text-center font-heading text-4xl font-medium">{mode === "forgot" ? "Forgot password" : "Choose a new password"}</h1>
      <p className="mt-2 text-center text-ink-soft">
        {mode === "forgot" ? "Enter your email and we'll send you a link to reset it." : "Pick something you haven't used elsewhere."}
      </p>

      {sent ? (
        <p role="status" className="mt-8 rounded-2xl border border-line bg-white p-6 text-center text-sm">
          If an account exists for <b>{email}</b>, a reset link is on its way. It stays valid for an hour.
        </p>
      ) : mode === "reset" && !token ? (
        <p role="alert" className="mt-8 rounded-2xl border border-line bg-white p-6 text-center text-sm">
          This reset link is incomplete. <Link href="/forgot-password" className="underline underline-offset-4">Request a new one</Link>.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6">
          {mode === "forgot" ? (
            <div>
              <label htmlFor="rec-email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="rec-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="you@example.com" />
            </div>
          ) : (
            <div>
              <label htmlFor="rec-pw" className="mb-1.5 block text-sm font-medium">New password</label>
              <input id="rec-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
          )}
          {error && <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
          <Button size="lg" className="w-full" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : "Save new password"}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-soft"><Link href="/login" className="text-ink underline underline-offset-4">Back to log in</Link></p>
    </div>
  );
}
