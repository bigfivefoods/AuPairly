import Link from "next/link";
import { MapPin, BadgeCheck } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export type NearYouCard = {
  id: string;
  href: string;
  name: string;
  image?: string | null;
  headline?: string | null;
  city?: string | null;
  isVerified?: boolean;
  badge?: string;
};

export function NearYouRail({
  title,
  subtitle,
  items,
  emptyHref,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  items: NearYouCard[];
  emptyHref: string;
  emptyLabel: string;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Near you
          </p>
          <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
          {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
        </div>
        <Link href={emptyHref} className="text-sm font-semibold text-teal-700 hover:underline">
          See all →
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
          {emptyLabel}{" "}
          <Link href={emptyHref} className="font-semibold text-teal-700 hover:underline">
            Browse
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-thin">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="w-56 shrink-0 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <UserAvatar name={item.name} image={item.image} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{item.name}</p>
                  {item.city && (
                    <p className="flex items-center gap-0.5 truncate text-[11px] text-stone-500">
                      <MapPin className="h-3 w-3" />
                      {item.city}
                    </p>
                  )}
                </div>
              </div>
              {item.headline && (
                <p className="mt-2 line-clamp-2 text-xs text-stone-600">{item.headline}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {item.isVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {item.badge && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
