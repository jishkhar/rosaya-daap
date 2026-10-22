import { redirect } from "next/navigation";

/** Existing bookmarks and hosted payment callbacks open confirmation inside checkout. */
export default async function OrderSuccess({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/checkout?order=${encodeURIComponent(id)}`);
}
