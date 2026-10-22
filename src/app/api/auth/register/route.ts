import { api, route, setSession } from "@/lib/bff";

type Session = { token: string; customer: unknown; expires_in: number };

export const POST = route(
  async ({ body }) => {
    const s = await api<Session>("/auth/register", { method: "POST", body });
    await setSession(s.token, s.expires_in);
    return { customer: s.customer };
  },
  { write: true },
);
