import { redirect } from "next/navigation";
import { api, ApiError, sessionToken } from "@/lib/bff";
import CheckoutForm from "./CheckoutForm";
import type { User } from "@/lib/auth";
import type { Address } from "@/lib/account";
import { FeatureUnavailable } from "@/components/FeatureUnavailable";
import { getStorefront } from "@/themes/registry";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { features } = await getStorefront();
  if (!features.cart)
    return (
      <FeatureUnavailable
        title="Online ordering is closed"
        message="This shop isn't taking orders on its website at the moment. Please contact the shop to order."
      />
    );
  const { order } = await searchParams;
  const orderId = typeof order === "string" ? order : undefined;
  const loginUrl = orderId
    ? `/login?next=${encodeURIComponent(`/checkout?order=${encodeURIComponent(orderId)}`)}`
    : "/login?next=/checkout";
  const token = await sessionToken();
  if (!token) redirect(loginUrl);

  // Validate the session with the ERP: a cookie alone may be expired or revoked.
  let user: User;
  let addresses: { items: Address[] };
  try {
    [user, addresses] = await Promise.all([
      api<User>("/me", { token }),
      features.addresses
        ? api<{ items: Address[] }>("/me/addresses", { token })
        : { items: [] },
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(loginUrl);
    throw error;
  }
  return (
    <CheckoutForm
      key={user.id}
      initialUser={user}
      initialAddresses={addresses.items}
      confirmationOrderId={orderId}
    />
  );
}
