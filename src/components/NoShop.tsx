/** Shown instead of a store when the address has no shop, or the shop's website is switched off. */
export function NoShop({ status }: { status: "missing" | "closed" }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-4 text-center text-ink">
      <div className="max-w-md">
        <h1 className="font-heading text-3xl font-medium">
          {status === "missing"
            ? "There's no shop here"
            : "This shop is closed for now"}
        </h1>
        <p className="mt-3 text-ink-soft">
          {status === "missing"
            ? "Check the address, or ask the shop for its correct link."
            : "Its website isn't taking visitors at the moment. Please check back later."}
        </p>
      </div>
    </main>
  );
}
