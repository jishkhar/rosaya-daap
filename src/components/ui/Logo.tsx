import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Rosaya Fashions — home" className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image src="/logo-mark.png" alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" priority />
      <span className="flex flex-col leading-none">
        <span className={`font-heading text-xl font-semibold tracking-[0.28em] sm:text-2xl ${light ? "text-cream" : "text-ink"}`}>ROSAYA</span>
        <span className={`mt-1 hidden text-[9px] uppercase tracking-[0.3em] sm:block ${light ? "text-gold" : "text-taupe-dark"}`}>Fashions</span>
      </span>
    </Link>
  );
}
