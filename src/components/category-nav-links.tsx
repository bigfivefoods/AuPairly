import Link from "next/link";
import { SERVICE_LIST } from "@/lib/services";

/**
 * Server component — static category links for the header.
 * Kept out of "use client" files to avoid hydration mismatches.
 */
export function CategoryNavLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`.trim()}>
      {SERVICE_LIST.map((s) => (
        <Link
          key={s.id}
          href={`/${s.slug}`}
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-teal-800"
        >
          {s.shortName}
        </Link>
      ))}
    </div>
  );
}
