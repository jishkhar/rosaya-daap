import { api, route } from "@/lib/bff";

/** The online ways this shop's Razorpay account takes (UPI, cards, net banking banks, wallets, EMI) for the payment step. */
export const GET = route(async () => api("/payment-options"));
