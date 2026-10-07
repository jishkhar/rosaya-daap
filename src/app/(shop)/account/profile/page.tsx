"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { call } from "@/lib/http";

const input = "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!user) return null;
  const value = name ?? user.name;

  const phoneValue = phone ?? (user.phone ?? "").replace(/^\+91/, "");

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (value.trim().length < 2) return setSaveError("Enter your full name.");
    if (phoneValue && !/^[6-9]\d{9}$/.test(phoneValue)) return setSaveError("Enter a valid 10-digit mobile number.");
    const r = await updateProfile({ name: value.trim(), ...(phoneValue ? { phone: phoneValue } : {}) });
    if (!r.ok) return setSaveError(r.error);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.current) return setPwMsg({ ok: false, text: "Enter your current password." });
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: "Passwords don't match." });
    const r = await call("/api/me/password", { method: "POST", body: { current_password: pw.current, new_password: pw.next } });
    if (!r.ok) return setPwMsg({ ok: false, text: r.error });
    setPw({ current: "", next: "", confirm: "" });
    setPwMsg({ ok: true, text: "Password updated. Other devices have been signed out." });
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-3xl font-medium">Profile</h1>

      <form onSubmit={saveName} className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-heading text-xl">Personal details</h2>
        <div>
          <label htmlFor="p-name" className="mb-1.5 block text-sm font-medium">Full name</label>
          <input id="p-name" autoComplete="name" value={value} onChange={(e) => setName(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="p-email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="p-email" value={user.email} readOnly className={`${input} bg-sand/60 text-ink-soft`} />
          <p className="mt-1 text-xs text-ink-soft">Your email is your login and can&apos;t be changed here.</p>
        </div>
        <div>
          <label htmlFor="p-phone" className="mb-1.5 block text-sm font-medium">Mobile number</label>
          <div className="flex gap-2"><span className="flex h-12 items-center rounded-xl border border-line bg-sand px-4 text-sm">+91</span>
            <input id="p-phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={phoneValue} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className={input} placeholder="98765 43210" /></div>
        </div>
        {saveError && <p role="alert" className="text-sm text-danger">{saveError}</p>}
        <button className="flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark">{saved ? <><Check className="h-4 w-4" /> Saved</> : "Save changes"}</button>
      </form>

      <form onSubmit={changePassword} noValidate className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-heading text-xl">Change password</h2>
        {(["current", "next", "confirm"] as const).map((k) => (
          <div key={k}>
            <label htmlFor={`pw-${k}`} className="mb-1.5 block text-sm font-medium">{{ current: "Current password", next: "New password", confirm: "Confirm new password" }[k]}</label>
            <input id={`pw-${k}`} type="password" autoComplete={k === "current" ? "current-password" : "new-password"} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} className={input} />
          </div>
        ))}
        {pwMsg && <p role="alert" className={`text-sm ${pwMsg.ok ? "text-success" : "text-danger"}`}>{pwMsg.text}</p>}
        <button className="h-12 rounded-full border border-ink px-8 text-sm font-medium hover:bg-ink hover:text-cream">Update password</button>
      </form>
    </div>
  );
}
