import { NextResponse } from "next/server";
import { api, ApiError, clearSession, route } from "@/lib/bff";

// 401 from the ERP means the session is gone (expired, signed out elsewhere): drop the cookie so the UI shows signed-out.
const guard = async (fn: () => Promise<unknown>) => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) await clearSession();
    throw e;
  }
};

export const GET = route(async ({ token }) => {
  if (!token) return NextResponse.json({ customer: null });
  try {
    return { customer: await api("/me", { token }) };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await clearSession();
      return { customer: null };
    }
    throw e;
  }
});
export const PATCH = route(
  ({ token, body }) =>
    guard(() => api("/me", { method: "PATCH", body, token })),
  { write: true },
);
