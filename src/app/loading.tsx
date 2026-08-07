export default function RootLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200/80" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-stone-100" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-stone-100 bg-stone-50"
          />
        ))}
      </div>
    </div>
  );
}
