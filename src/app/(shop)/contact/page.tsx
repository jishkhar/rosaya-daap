import { InfoPage } from "@/components/ui/InfoPage";
import { getPolicies } from "@/lib/store";
import { getStorefront } from "@/themes/registry";

export const metadata = { title: "Contact" };

/**
 * The shop's "Contact information" policy (Settings > Policies), then its contact lines from the footer settings (email falls back to
 * the business email).
 */
export default async function Page() {
  const [{ footer }, policies] = await Promise.all([
    getStorefront().then((s) => s.config.settings),
    getPolicies(),
  ]);
  const email = footer.email as string;
  const lines = [footer.address as string, footer.phone as string].filter(
    Boolean,
  );
  if (!policies.contact && !email && !lines.length)
    return <InfoPage title="Contact" />;
  return (
    <InfoPage title="Contact">
      {policies.contact && (
        <div
          className="rich-description"
          dangerouslySetInnerHTML={{ __html: policies.contact }}
        />
      )}
      {email && (
        <p>
          Email:{" "}
          <a
            href={`mailto:${email}`}
            className="text-ink underline underline-offset-4"
          >
            {email}
          </a>
        </p>
      )}
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </InfoPage>
  );
}
