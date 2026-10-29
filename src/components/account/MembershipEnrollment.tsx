"use client";

import { useState } from "react";
import { MembershipCard } from "@/components/account/MembershipCard";
import { useAuth, type User } from "@/lib/auth";
import { mobileError, nationalDigits } from "@/lib/phone";

const input =
  "h-12 min-w-0 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

export function MembershipEnrollment({ user }: { user: User }) {
  const { enrollMembership } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [form, setForm] = useState({ name: "", birthday: "", phone: "" });
  const today = new Date();
  const maxBirthday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (
      form.name.trim().length < 2 ||
      !form.birthday ||
      form.birthday > maxBirthday ||
      Boolean(mobileError(form.phone))
    ) {
      setError(
        "Enter your full name, valid date of birth and 10-digit mobile number.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await enrollMembership({
        ...form,
        name: form.name.trim(),
        email: user.email,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJoined(true);
      setOpen(false);
    } catch {
      setError("Couldn't activate your membership. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (user.membership?.eligible)
    return (
      <>
        <MembershipCard user={user} />
        {joined && (
          <p role="status" className="mt-2 text-sm text-success">
            You’re now a member. Your loyalty points are ready to use.
          </p>
        )}
      </>
    );
  return (
    <section
      aria-labelledby="join-membership-title"
      className="mt-6 rounded-2xl border border-line bg-white px-5 py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 id="join-membership-title" className="font-heading text-lg">
            Become a member
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Earn and redeem loyalty points. Join with your name, date of birth,
            phone and email.
          </p>
          {user.loyalty.points > 0 && (
            <p className="mt-1 text-xs text-ink-soft">
              Your existing {user.loyalty.points.toLocaleString("en-IN")} points
              unlock when you join.
            </p>
          )}
        </div>
        {!open && (
          <button
            type="button"
            aria-expanded={false}
            aria-controls="membership-enrollment-form"
            onClick={() => {
              setForm({
                name: user.name,
                birthday: user.birthday ?? "",
                phone: nationalDigits(user.phone),
              });
              setError(null);
              setOpen(true);
            }}
            className="h-11 w-full shrink-0 rounded-full bg-ink px-5 text-sm font-medium text-cream hover:bg-taupe-dark sm:w-auto"
          >
            Become a member
          </button>
        )}
      </div>
      {open && (
        <form
          id="membership-enrollment-form"
          onSubmit={submit}
          aria-busy={busy}
          className="mt-4 border-t border-line pt-4"
        >
          <fieldset
            disabled={busy}
            className="grid min-w-0 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="member-name"
                className="mb-1.5 block text-sm font-medium"
              >
                Full name
              </label>
              <input
                id="member-name"
                required
                minLength={2}
                autoComplete="name"
                className={input}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="member-birthday"
                className="mb-1.5 block text-sm font-medium"
              >
                Date of birth
              </label>
              <input
                id="member-birthday"
                required
                type="date"
                autoComplete="bday"
                max={maxBirthday}
                className={input}
                value={form.birthday}
                onChange={(event) =>
                  setForm({ ...form, birthday: event.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="member-phone"
                className="mb-1.5 block text-sm font-medium"
              >
                Mobile number
              </label>
              <div className="flex gap-2">
                <span className="flex h-12 items-center rounded-xl border border-line bg-sand px-4 text-sm">
                  +91
                </span>
                <input
                  id="member-phone"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  className={input}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="member-email"
                className="mb-1.5 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="member-email"
                required
                type="email"
                readOnly
                className={`${input} bg-sand/60 text-ink-soft`}
                value={user.email}
              />
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-full bg-ink px-6 text-sm font-medium text-cream hover:bg-taupe-dark disabled:opacity-60 sm:w-auto"
            >
              {busy ? "Joining…" : "Become a member"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="h-12 w-full rounded-full border border-line px-6 text-sm font-medium hover:bg-sand disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
