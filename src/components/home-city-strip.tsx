import Link from "next/link";
import { MapPin } from "lucide-react";

export function HomeCityStrip({
  cities,
}: {
  cities: { city: string; sitters: number; hosts: number; total: number }[];
}) {
  if (!cities.length) return null;

  return (
    <section className="border-b border-stone-200 bg-stone-50/80">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Live density
            </p>
            <h2 className="font-display text-lg font-semibold text-stone-900 sm:text-xl">
              Active listings by city
            </h2>
          </div>
          <Link
            href="/cities"
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            All cities →
          </Link>
        </div>
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {cities.slice(0, 6).map((c) => (
            <li key={c.city} className="min-w-[9.5rem] shrink-0 sm:min-w-0">
              <Link
                href={`/browse/aupairs?city=${encodeURIComponent(c.city)}`}
                className="block rounded-2xl border border-stone-200 bg-white px-3 py-3 shadow-sm transition hover:border-teal-300"
              >
                <p className="flex items-center gap-1 truncate text-sm font-semibold text-stone-900">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                  {c.city}
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  <span className="font-semibold text-teal-800">{c.sitters}</span>{" "}
                  sitters ·{" "}
                  <span className="font-semibold text-sky-800">{c.hosts}</span>{" "}
                  hosts
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-500">
          Thin cities: be first — founding hosts &amp; sitters get a free featured
          week when they publish.
        </p>
      </div>
    </section>
  );
}
