import { call } from "@/lib/http";

/** What the ERP's pincode directory says about a pincode (India Post data): its district, its state (the GST place of supply) and,
 * for the few border pincodes, the other states it reaches. */
export type Place = {
  pincode: string;
  district: string;
  state_code: string;
  state: string;
  states: { code: string; name: string }[];
  localities: string[];
};

export const PINCODE_RE = /^[1-9]\d{5}$/;

const known = new Map<string, Place | null>(); // per page load: typing a pincode again costs no request

/** The pincode's place, `null` when India Post has no such pincode, `undefined` when it could not be checked (offline). */
export async function lookupPincode(
  pin: string,
): Promise<Place | null | undefined> {
  if (!PINCODE_RE.test(pin)) return null;
  if (known.has(pin)) return known.get(pin);
  const r = await call<Place>(`/api/pincodes/${pin}`);
  if (r.ok) known.set(pin, r.data);
  else if (r.status === 404) known.set(pin, null);
  else return undefined;
  return known.get(pin);
}

/** The state to keep for `place`: what the shopper chose when the pincode reaches it, otherwise the pincode's own state. */
export function stateFor(place: Place, current: string): string {
  const typed = current.trim().toLowerCase();
  return (
    place.states.find((s) => s.name.toLowerCase() === typed)?.name ??
    place.state
  );
}

export const UNKNOWN_PINCODE =
  "We don't recognise this pincode. Please check it.";
