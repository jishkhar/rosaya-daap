"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { MembershipCard } from "@/components/account/MembershipCard";
import { useAuth } from "@/lib/auth";
import { call } from "@/lib/http";

const input =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const customerId = user?.id;
  useEffect(() => {
    if (!customerId) return;
    const refresh = () => {
      void refreshUser();
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [customerId, refreshUser]);
  if (!user) return null;
  const value = name ?? user.name;

  const phoneValue = phone ?? (user.phone ?? "").replace(/^\+91/, "");

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaveError(null);
    setSaved(false);
    if (value.trim().length < 2) return setSaveError("Enter your full name.");
    if (phoneValue && !/^[6-9]\d{9}$/.test(phoneValue))
      return setSaveError("Enter a valid 10-digit mobile number.");
    setSaving(true);
    try {
      const r = await updateProfile({
        name: value.trim(),
        ...(phoneValue ? { phone: phoneValue } : {}),
      });
      if (!r.ok) return setSaveError(r.error);
      setName(null);
      setPhone(null);
      setSaved(true);
    } catch {
      setSaveError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current)
      return setPwMsg({ ok: false, text: "Enter your current password." });
    if (pw.next.length < 8)
      return setPwMsg({
        ok: false,
        text: "New password must be at least 8 characters.",
      });
    if (pw.next !== pw.confirm)
      return setPwMsg({ ok: false, text: "Passwords don't match." });
    const r = await call("/api/me/password", {
      method: "POST",
      body: { current_password: pw.current, new_password: pw.next },
    });
    if (!r.ok) return setPwMsg({ ok: false, text: r.error });
    setPw({ current: "", next: "", confirm: "" });
    setShowPw({ current: false, next: false, confirm: false });
    setPwMsg({
      ok: true,
      text: "Password updated. Other devices have been signed out.",
    });
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-medium">Profile</h1>

      <MembershipCard user={user} />

      <div className="mt-6">
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
          <form
            onSubmit={saveName}
            aria-busy={saving}
            className="space-y-4 rounded-2xl border border-line bg-white p-6"
          >
            <h2 className="font-heading text-xl">Personal details</h2>
            <div>
              <label
                htmlFor="p-name"
                className="mb-1.5 block text-sm font-medium"
              >
                Full name
              </label>
              <input
                id="p-name"
                autoComplete="name"
                value={value}
                disabled={saving}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                  setSaveError(null);
                }}
                className={input}
              />
            </div>
            <div>
              <label
                htmlFor="p-email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="p-email"
                value={user.email}
                readOnly
                className={`${input} bg-sand/60 text-ink-soft`}
              />
              <p className="mt-1 text-xs text-ink-soft">
                Your email is your login and can&apos;t be changed here.
              </p>
            </div>
            <div>
              <label
                htmlFor="p-phone"
                className="mb-1.5 block text-sm font-medium"
              >
                Mobile number
              </label>
              <div className="flex gap-2">
                <span className="flex h-12 items-center rounded-xl border border-line bg-sand px-4 text-sm">
                  +91
                </span>
                <input
                  id="p-phone"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  value={phoneValue}
                  disabled={saving}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    setSaved(false);
                    setSaveError(null);
                  }}
                  className={input}
                  placeholder="98765 43210"
                />
              </div>
            </div>
            {saveError && (
              <p role="alert" className="text-sm text-danger">
                {saveError}
              </p>
            )}
            {saved && (
              <p role="status" className="text-sm text-success">
                Profile updated successfully.
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                "Saving…"
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Saved
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </form>

          <form
            onSubmit={changePassword}
            noValidate
            className="space-y-4 rounded-2xl border border-line bg-white p-6"
          >
            <h2 className="font-heading text-xl">Change password</h2>
            {(["current", "next", "confirm"] as const).map((k) => (
              <div key={k}>
                <label
                  htmlFor={`pw-${k}`}
                  className="mb-1.5 block text-sm font-medium"
                >
                  {
                    {
                      current: "Current password",
                      next: "New password",
                      confirm: "Confirm new password",
                    }[k]
                  }
                </label>
                <div className="relative">
                  <input
                    id={`pw-${k}`}
                    type={showPw[k] ? "text" : "password"}
                    autoComplete={
                      k === "current" ? "current-password" : "new-password"
                    }
                    value={pw[k]}
                    onChange={(e) => setPw({ ...pw, [k]: e.target.value })}
                    className={`${input} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPw((prev) => ({ ...prev, [k]: !prev[k] }))
                    }
                    aria-label={`${showPw[k] ? "Hide" : "Show"} ${{ current: "current password", next: "new password", confirm: "confirm new password" }[k]}`}
                    aria-controls={`pw-${k}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {showPw[k] ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {pwMsg && (
              <p
                role="alert"
                className={`text-sm ${pwMsg.ok ? "text-success" : "text-danger"}`}
              >
                {pwMsg.text}
              </p>
            )}
            <button className="h-12 rounded-full border border-ink px-8 text-sm font-medium hover:bg-ink hover:text-cream">
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
