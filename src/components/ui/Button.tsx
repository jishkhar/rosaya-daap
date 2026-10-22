import Link from "next/link";
import clsx from "clsx";

type Common = {
  variant?: "primary" | "outline" | "soft" | "light";
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const styles = {
  primary: "bg-ink text-cream hover:bg-taupe-dark",
  outline: "border border-ink text-ink hover:bg-ink hover:text-cream",
  soft: "bg-taupe text-ink hover:bg-gold",
  light: "bg-cream text-ink hover:bg-sand",
};

const cls = (
  v: NonNullable<Common["variant"]>,
  s: NonNullable<Common["size"]>,
  extra?: string,
) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    s === "lg" ? "h-12 px-8 text-sm" : "h-10 px-5 text-sm",
    styles[v],
    extra,
  );

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cls(variant, size, className)} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  onClick,
}: Common & { href: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cls(variant, size, className)}
    >
      {children}
    </Link>
  );
}
