import { api, route } from "@/lib/bff";

export const POST = route(({ body }) => api("/auth/forgot-password", { method: "POST", body }), { write: true });
