import { formatINR, percentOff } from "@/lib/money";

export function Price({ price, mrp, size = "sm" }: { price: number; mrp?: number | null; size?: "sm" | "lg" }) {
  const off = percentOff(price, mrp);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={size === "lg" ? "text-2xl font-semibold" : "text-sm font-semibold"}>{formatINR(price)}</span>
      {off > 0 && (
        <>
          <span className={`text-ink-soft line-through ${size === "lg" ? "text-base" : "text-xs"}`}>{formatINR(mrp!)}</span>
          <span className={`font-medium text-accent ${size === "lg" ? "text-base" : "text-xs"}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}
