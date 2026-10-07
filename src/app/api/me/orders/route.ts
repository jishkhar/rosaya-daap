import { api, route } from "@/lib/bff";

export const GET = route(({ token }) => api("/me/orders", { token }));
