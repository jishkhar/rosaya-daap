import Link from "next/link";

/** Shown in place of a part of the website the shop has switched off (customer accounts, online ordering ...). */
export function FeatureUnavailable({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <h1 className="font-heading text-3xl font-medium">{title}</h1>
      <p className="mt-3 text-ink-soft">{message}</p>
      <Link href="/" className="mt-6 text-sm font-medium underline">
        Back to the shop
      </Link>
    </div>
  );
}
