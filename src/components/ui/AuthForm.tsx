"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBrand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";

const input =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

const Err = ({ errors, k }: { errors: Record<string, string>; k: string }) =>
  errors[k] ? (
    <p role="alert" className="mt-1 text-xs text-danger">
      {errors[k]}
    </p>
  ) : null;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register: signUp } = useAuth();
  const brand = useBrand();
  const router = useRouter();
  // Only same-site paths: never bounce a shopper to an address a link smuggled in.
  const params = useSearchParams();
  const next = params.get("next");
  const justReset = params.get("reset") === "1";
  const dest =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (register && name.trim().length < 2) err.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email))
      err.email = "Enter a valid email address.";
    if (register && !/^[6-9]\d{9}$/.test(phone))
      err.phone = "Enter a valid 10-digit mobile number.";
    if (register && (!birthday || birthday > today))
      err.birthday = "Enter your date of birth.";
    if (password.length < (register ? 8 : 1))
      err.password = register
        ? "Use at least 8 characters."
        : "Enter your password.";
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;
    setBusy(true);
    const r = register
      ? await signUp({
          name: name.trim(),
          email: email.trim(),
          password,
          phone,
          birthday,
        })
      : await login(email.trim(), password);
    setBusy(false);
    if (r.ok) router.push(dest);
    else setFormError(r.error);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <h1 className="text-center font-heading text-4xl font-medium">
        {register ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-center text-ink-soft">
        {register
          ? "Join as a member to earn loyalty points, save addresses and check out faster."
          : "Log in with your email to track orders and save addresses."}
      </p>

      {justReset && !register && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-success/10 p-3 text-center text-sm text-success"
        >
          Password updated — log in with your new password.
        </p>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="mt-8 space-y-4 rounded-2xl border border-line bg-white p-6"
      >
        {register && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
            <Err errors={errors} k="name" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            placeholder="you@example.com"
          />
          <Err errors={errors} k="email" />
        </div>
        {register && (
          <>
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium"
              >
                Mobile number
              </label>
              <div className="flex gap-2">
                <span className="flex h-12 items-center rounded-xl border border-line bg-sand px-4 text-sm">
                  +91
                </span>
                <input
                  id="phone"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className={input}
                />
              </div>
              <Err errors={errors} k="phone" />
            </div>
            <div>
              <label
                htmlFor="birthday"
                className="mb-1.5 block text-sm font-medium"
              >
                Date of birth
              </label>
              <input
                id="birthday"
                type="date"
                autoComplete="bday"
                max={today}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className={input}
              />
              <Err errors={errors} k="birthday" />
            </div>
          </>
        )}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {!register && (
              <Link
                href="/forgot-password"
                className="text-xs underline underline-offset-4"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${input} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="touch-target absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft hover:text-ink"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Err errors={errors} k="password" />
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
          >
            {formError}
          </p>
        )}

        <Button size="lg" className="w-full" type="submit" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {register ? (
          <>
            Already have an account?{" "}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="text-ink underline underline-offset-4"
            >
              Log in
            </Link>
          </>
        ) : (
          <>
            New to {brand.name || "our store"}?{" "}
            <Link
              href={
                next
                  ? `/register?next=${encodeURIComponent(next)}`
                  : "/register"
              }
              className="text-ink underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
