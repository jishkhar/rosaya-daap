import { redirect } from "next/navigation";
import { api, ApiError, sessionToken } from "@/lib/bff";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const token = await sessionToken();
  if (!token) redirect("/login?next=/checkout");

  // Validate the session with the ERP: a cookie alone may be expired or revoked.
  try {
    await api("/me", { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?next=/checkout");
    throw error;
  }

  return <CheckoutForm />;
}
