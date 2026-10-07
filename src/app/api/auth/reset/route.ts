import { api, route } from "@/lib/bff";

export const POST = route(({ body }) => api("/auth/reset-password", { method: "POST", body }), { write: true });
