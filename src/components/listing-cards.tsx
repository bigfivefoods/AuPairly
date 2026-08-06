import Link from "next/link";
import { MapPin, Calendar, Clock, Baby, Languages } from "lucide-react";
import { Avatar, Badge, Stars, VerifiedBadge } from "@/components/ui";
import { formatLocation, parseJsonArray } from "@/lib/utils";
import { format } from "date-fns";

type AuPairCardProps = {
  id: string;
  name: string;
  image?: string | null;
  headline?: string | null;
  city?: string | null;
  country?: string | null;
  nationality?: string | null;
  languages: string;
  experienceYears: number;
  age?: number | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  pocketMoneyMin?: number | null;
  availableFrom?: Date | string | null;
  weeklyHours?: number | null;
};

export function AuPairCard(p: AuPairCardProps) {
  const langs = parseJsonArray(p.languages).slice(0, 3);
  return (
    <Link
      href={`/browse/aupairs/${p.id}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[var(--shadow)]"
    >
      <div className="relative h-40 bg-gradient-to-br from-teal-100 via-teal-50 to-orange-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={p.name} image={p.image} size="xl" className="!ring-4 !ring-white/80 shadow-lg" />
        </div>
        {p.isVerified && (
          <div className="absolute right-3 top-3">
            <VerifiedBadge />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-stone-900 group-hover:text-teal-700">
              {p.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{p.headline}</p>
          </div>
          {p.rating > 0 && <Stars rating={p.rating} count={p.reviewCount} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatLocation(p.city, p.country)}
          </span>
          {p.nationality && <Badge>{p.nationality}</Badge>}
          {p.age && <Badge>{p.age} yrs</Badge>}
        </div>
        {langs.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-600">
            <Languages className="h-3.5 w-3.5 text-teal-600" />
            {langs.join(" · ")}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4 mt-4 text-sm">
          <span className="text-stone-500">{p.experienceYears}+ yrs experience</span>
          {p.pocketMoneyMin ? (
            <span className="font-semibold text-teal-700">from ${p.pocketMoneyMin}/wk</span>
          ) : (
            <span className="text-stone-400">Open to discuss</span>
          )}
        </div>
      </div>
    </Link>
  );
}

type FamilyCardProps = {
  id: string;
  name: string;
  familyName?: string | null;
  image?: string | null;
  headline?: string | null;
  city?: string | null;
  country?: string | null;
  childrenCount: number;
  childrenAges: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  pocketMoney?: number | null;
  startDate?: Date | string | null;
  weeklyHours?: number | null;
  languages: string;
};

export function FamilyCard(p: FamilyCardProps) {
  const ages = parseJsonArray(p.childrenAges);
  return (
    <Link
      href={`/browse/families/${p.id}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[var(--shadow)]"
    >
      <div className="relative h-40 bg-gradient-to-br from-orange-100 via-amber-50 to-teal-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={p.familyName || p.name} image={p.image} size="xl" className="!ring-4 !ring-white/80 shadow-lg" />
        </div>
        {p.isVerified && (
          <div className="absolute right-3 top-3">
            <VerifiedBadge />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-stone-900 group-hover:text-teal-700">
              {p.familyName || p.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{p.headline}</p>
          </div>
          {p.rating > 0 && <Stars rating={p.rating} count={p.reviewCount} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatLocation(p.city, p.country)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Baby className="h-3.5 w-3.5" />
            {p.childrenCount} {p.childrenCount === 1 ? "child" : "children"}
            {ages.length > 0 && ` · ages ${ages.join(", ")}`}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
          {p.startDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              From {format(new Date(p.startDate), "MMM yyyy")}
            </span>
          )}
          {p.weeklyHours && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {p.weeklyHours}h / week
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4 mt-4 text-sm">
          <span className="text-stone-500">Seeking au pair</span>
          {p.pocketMoney ? (
            <span className="font-semibold text-teal-700">${p.pocketMoney}/wk</span>
          ) : (
            <span className="text-stone-400">Competitive pay</span>
          )}
        </div>
      </div>
    </Link>
  );
}
