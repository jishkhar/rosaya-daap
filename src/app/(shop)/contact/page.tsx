import { InfoPage } from "@/components/ui/InfoPage";
import { getStorefront } from "@/themes/registry";

export const metadata = { title: "Contact" };

/** The shop's contact lines from its footer settings (email falls back to the business email). */
export default async function Page() {
  const { footer } = (await getStorefront()).config.settings;
  const email = footer.email as string;
  const lines = [footer.address as string, footer.phone as string].filter(
    Boolean,
  );
  if (!email && !lines.length) return <InfoPage title="Contact" />;
  return (
    <InfoPage title="Contact">
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
