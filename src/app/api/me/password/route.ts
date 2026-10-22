import { api, route, setSession } from "@/lib/bff";

export const POST = route(
  async ({ token, body }) => {
    const s = await api<{ token: string; expires_in: number }>("/me/password", {
      method: "POST",
      body,
      token,
    });
    await setSession(s.token, s.expires_in); // changing the password signs out every other device; this one gets a fresh token
  },
  { write: true },
);
