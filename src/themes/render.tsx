import "server-only";
import { Fragment } from "react";
import type { SectionInstance } from "@/themes/schema";
import type { Theme } from "@/themes/types";

/** Load every section's data in parallel, then render them in order. Unknown section types are skipped, never fatal. */
export async function RenderSections({ theme, sections }: { theme: Theme; sections: SectionInstance[] }) {
  const placed = sections.flatMap((s) => {
    const def = theme.sections[s.type];
    return def ? [{ s, def }] : [];
  });
  const results = await Promise.allSettled(placed.map(({ s, def }) => (def.load ? def.load(s.settings) : Promise.resolve(undefined))));
  const unavailable = results.some((r) => r.status === "rejected");

  return (
    <>
      {placed.map(({ s, def }, i) => (
        <Fragment key={s.id}>
          <def.Component settings={s.settings} data={results[i].status === "fulfilled" ? results[i].value : undefined} />
          {i === 0 && unavailable && (
            <div role="status" className="mx-auto mt-6 max-w-[1400px] px-4 text-sm text-ink-soft sm:px-6">
              Some products are temporarily unavailable. Please try again in a moment. <form action="/" className="inline"><button type="submit" className="font-medium underline">Try again</button></form>
            </div>
          )}
        </Fragment>
      ))}
    </>
  );
}
