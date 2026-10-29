import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";

/* Shoppers' phone numbers: the same rule as the server (shopconnect-backend/core/phone.py, on libphonenumber), which stays the authority
 * and stores E.164 ("+919876543210"). Every phone on the website is a person's mobile, so the fields here take the 10 digits after a fixed
 * "+91" and this checks them with the mobile-only metadata (smaller than the full set the back office uses). India only for now. */
export const COUNTRY_PREFIX = "+91";
export const MOBILE_MESSAGE = "Enter a valid 10-digit mobile number.";

/** The message to show for these digits, or undefined when they are a valid Indian mobile. */
export function mobileError(digits: string): string | undefined {
  const number = parsePhoneNumberFromString(digits, "IN");
  return number?.isValid() && number.country === "IN"
    ? undefined
    : MOBILE_MESSAGE;
}

/** The 10 digits typed -> "+919876543210" (what the server stores). Call after mobileError said they are fine. */
export const toE164 = (digits: string) =>
  parsePhoneNumberFromString(digits, "IN")?.number ?? digits;

/** A stored number -> the 10 digits the field shows after "+91". */
export const nationalDigits = (value: string | null | undefined) =>
  (value ?? "").replace(/^\+91/, "").replace(/\D/g, "");

/** For reading: "+91 98765 43210". A value that does not parse is shown as it is. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const number = parsePhoneNumberFromString(value, "IN");
  return number?.isValid() ? number.formatInternational() : value;
}
