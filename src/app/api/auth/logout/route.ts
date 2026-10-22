import { clearSession, route } from "@/lib/bff";

export const POST = route(
  async () => {
    await clearSession();
  },
  { write: true },
);
