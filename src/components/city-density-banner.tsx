import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { CityDensity } from "@/lib/city-density";

export function CityDensityBanner({
  density,
  side,
}: {
  density: CityDensity;
  side: "sitters" | "hosts";
}) {
  const needMore = density.thin || density.total === 0;
  return (
    <div
      className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
        needMore
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-teal-100 bg-teal-50/60 text-teal-950"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {density.city}
            {!needMore && (
              <span className="ml-2 font-normal opacity-80">
                · {density.sitters} sitters · {density.hosts} hosts
              </span>
            )}
          </p>
          <p className="mt-0.5 opacity-90">{density.emptyHint}</p>
          {needMore && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={
                  side === "sitters"
                    ? "/register?role=AUPAIR"
                    : "/register?role=PARENT"
                }
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
              >
                <Users className="h-3.5 w-3.5" />
                {side === "sitters" ? "List as sitter" : "Post host listing"}
              </Link>
              <Link
                href="/invite"
                className="inline-flex items-center gap-1 rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Invite people in {density.city}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
