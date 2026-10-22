/** Shown while a catalogue page's data is fetched from the ERP. */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mb-8 h-40 animate-pulse rounded-3xl bg-sand" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[3/4] animate-pulse rounded-xl bg-sand" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-sand" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-sand" />
          </li>
        ))}
      </ul>
    </div>
  );
}
