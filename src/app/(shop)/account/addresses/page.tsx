"use client";

import { useRef, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useRemoteList, type Address } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { call } from "@/lib/http";
import {
  lookupPincode,
  PINCODE_RE,
  stateFor,
  UNKNOWN_PINCODE,
  type Place,
} from "@/lib/pincode";

const input =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";
type Form = {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  pincode: string;
  city: string;
  state: string;
};
const empty: Form = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  pincode: "",
  city: "",
  state: "",
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AddressesPage() {
  const { user } = useAuth();
  const { items, ready, reload } = useRemoteList<Address>(
    "/api/me/addresses",
    !!user,
  );
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // The pincode sets the state (and suggests the city); a border pincode offers its states.
  const [pinPlace, setPinPlace] = useState<{
    pin: string;
    place: Place | null;
  }>();
  const latestPin = useRef("");
  const here =
    pinPlace && pinPlace.pin === form.pincode ? pinPlace.place : undefined;
  const onPincode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "");
    latestPin.current = pin;
    setForm((f) => ({ ...f, pincode: pin }));
    if (!PINCODE_RE.test(pin)) return;
    void lookupPincode(pin).then((found) => {
      if (found === undefined || latestPin.current !== pin) return;
      setPinPlace({ pin, place: found });
      if (found)
        setForm((f) => ({
          ...f,
          state: stateFor(found, f.state),
          city: f.city.trim() ? f.city : found.district,
        }));
      setErrors((current) => {
        const rest = { ...current };
        delete rest.pincode;
        return found ? rest : { ...rest, pincode: UNKNOWN_PINCODE };
      });
    });
  };

  if (!ready)
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-sand"
        aria-label="Loading addresses"
      />
    );

  const startEdit = (a: Address | "new") => {
    setEditing(a);
    setForm(
      a === "new"
        ? { ...empty, name: user?.name ?? "" }
        : {
            label: a.label ?? "Home",
            name: a.name ?? "",
            phone: (a.phone ?? "").replace(/^\+91/, ""),
            line1: a.line1,
            line2: a.line2 ?? "",
            pincode: a.pincode ?? "",
            city: a.city ?? "",
            state: a.state ?? "",
          },
    );
    setErrors({});
    setApiError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Enter the recipient's name.";
    if (!/^[6-9]\d{9}$/.test(form.phone))
      err.phone = "Enter a valid 10-digit mobile number.";
    if (form.line1.trim().length < 5) err.line1 = "Enter the address.";
    if (!/^[1-9]\d{5}$/.test(form.pincode))
      err.pincode = "Enter a valid 6-digit pincode.";
    else if (here === null) err.pincode = UNKNOWN_PINCODE;
    if (!form.city.trim()) err.city = "Enter the city.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    setApiError(null);
    const body = {
      ...form,
      line2: form.line2 || null,
      is_default: editing !== "new" && editing ? editing.is_default : false,
    };
    const r =
      editing === "new"
        ? await call("/api/me/addresses", { method: "POST", body })
        : await call(`/api/me/addresses/${(editing as Address).id}`, {
            method: "PUT",
            body,
          });
    setSaving(false);
    if (!r.ok) return setApiError(r.error);
    setEditing(null);
    await reload();
  };

  const setDefault = async (a: Address) => {
    await call(`/api/me/addresses/${a.id}`, {
      method: "PUT",
      body: {
        label: a.label,
        name: a.name ?? "",
        phone: (a.phone ?? "").replace(/^\+91/, ""),
        line1: a.line1,
        line2: a.line2,
        city: a.city ?? "",
        state: a.state ?? "",
        pincode: a.pincode ?? "",
        is_default: true,
      },
    });
    await reload();
  };
  const remove = async (id: string) => {
    await call(`/api/me/addresses/${id}`, { method: "DELETE" });
    await reload();
  };
  const set =
    (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({
        ...form,
        [k]:
          k === "phone" || k === "pincode"
            ? e.target.value.replace(/\D/g, "")
            : e.target.value,
      });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-medium">Addresses</h1>
        {!editing && items.length > 0 && (
          <button
            onClick={() => startEdit("new")}
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-cream hover:bg-taupe-dark"
          >
            <Plus className="h-4 w-4" /> Add address
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={submit}
          noValidate
          className="mt-6 grid gap-4 rounded-2xl border border-ink bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="font-heading text-xl sm:col-span-2">
            {editing === "new" ? "New address" : "Edit address"}
          </h2>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Label</span>
            <div className="flex gap-2">
              {["Home", "Work", "Other"].map((l) => (
                <button
                  type="button"
                  key={l}
                  aria-pressed={form.label === l}
                  onClick={() => setForm({ ...form, label: l })}
                  className={`h-10 rounded-full border px-5 text-sm ${form.label === l ? "border-ink bg-ink text-cream" : "border-line hover:border-ink"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <Field id="a-name" label="Full name" error={errors.name}>
            <input
              id="a-name"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
              className={input}
            />
          </Field>
          <Field id="a-phone" label="Mobile number" error={errors.phone}>
            <input
              id="a-phone"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={form.phone}
              onChange={set("phone")}
              className={input}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="a-l1" label="Address" error={errors.line1}>
              <input
                id="a-l1"
                autoComplete="address-line1"
                value={form.line1}
                onChange={set("line1")}
                className={input}
                placeholder="House no., building, street"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="a-l2" label="Landmark (optional)">
              <input
                id="a-l2"
                value={form.line2}
                onChange={set("line2")}
                className={input}
              />
            </Field>
          </div>
          <Field id="a-pin" label="Pincode" error={errors.pincode}>
            <input
              id="a-pin"
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              value={form.pincode}
              onChange={onPincode}
              className={input}
            />
          </Field>
          <Field id="a-city" label="City" error={errors.city}>
            <input
              id="a-city"
              autoComplete="address-level2"
              value={form.city}
              onChange={set("city")}
              className={input}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="a-state" label="State" error={errors.state}>
              {here && here.states.length > 1 ? (
                <select
                  id="a-state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={input}
                >
                  {here.states.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="a-state"
                  autoComplete="address-level1"
                  value={form.state}
                  readOnly
                  placeholder="Filled in from the pincode"
                  className={`${input} cursor-default bg-transparent`}
                />
              )}
            </Field>
          </div>
          {apiError && (
            <p
              role="alert"
              className="rounded-xl bg-danger/10 p-3 text-sm text-danger sm:col-span-2"
            >
              {apiError}
            </p>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button
              disabled={saving}
              className="h-12 rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-12 rounded-full border border-ink px-8 text-sm font-medium hover:bg-sand"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MapPin className="h-12 w-12 text-taupe" strokeWidth={1.2} />
          <p className="font-heading text-xl">No saved addresses</p>
          <p className="text-sm text-ink-soft">
            Save an address to check out faster.
          </p>
          <button
            onClick={() => startEdit("new")}
            className="mt-2 flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark"
          >
            <Plus className="h-4 w-4" /> Add address
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <li
              key={a.id}
              className={`flex flex-col rounded-2xl border bg-white p-5 ${a.is_default ? "border-ink" : "border-line"}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="font-heading text-lg">{a.label}</span>
                {a.is_default && (
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
                {a.line1}
                {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone && `+91 ${a.phone.replace(/^\+91/, "")}`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <button
                  onClick={() => startEdit(a)}
                  className="underline underline-offset-4"
                >
                  Edit
                </button>
                {!a.is_default && (
                  <button
                    onClick={() => setDefault(a)}
                    className="underline underline-offset-4"
                  >
                    Make default
                  </button>
                )}
                <button
                  onClick={() => remove(a.id)}
                  aria-label={`Delete ${a.label ?? "saved"} address`}
                  className="ml-auto flex items-center gap-1 text-ink-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
