import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="font-heading text-7xl text-taupe">404</p>
      <h1 className="mt-4 font-heading text-3xl">This page has wandered off</h1>
      <p className="mt-2 text-ink-soft">
        Let&apos;s get you back to something beautiful.
      </p>
      <ButtonLink href="/" size="lg" className="mt-8">
        Back to home
      </ButtonLink>
    </div>
  );
}
