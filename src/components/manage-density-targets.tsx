import Link from "next/link";
import { Card } from "@/components/ui";
import {
  DENSITY_TARGET_SIDE,
  type CityTargetRow,
} from "@/lib/city-density-shared";

export function ManageDensityTargets({
  targets,
  metrosReady,
  thinCount,
}: {
  targets: CityTargetRow[];
  metrosReady: number;
  thinCount: number;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-900">
            City density targets
          </h2>
          <p className="text-xs text-stone-500">
            Goal: ≥{DENSITY_TARGET_SIDE} active sitters{" "}
            <strong>and</strong> ≥{DENSITY_TARGET_SIDE} active hosts per city.
            Prioritise red rows for invites &amp; outreach.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
            {metrosReady} healthy cities
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
            {thinCount} need supply
          </span>
          <a
            href="/api/admin/export/density"
            className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-200"
          >
            Export CSV
          </a>
          <Link
            href="/invite"
            className="rounded-full bg-teal-100 px-2.5 py-1 font-semibold text-teal-900 hover:bg-teal-200"
          >
            Invite playbook →
          </Link>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="sticky top-0 border-b border-stone-100 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2.5 font-semibold">City</th>
                <th className="px-3 py-2.5 font-semibold">Sitters</th>
                <th className="px-3 py-2.5 font-semibold">Hosts</th>
                <th className="px-3 py-2.5 font-semibold">Gap</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-stone-400"
                  >
                    No city data yet — publish listings to seed density.
                  </td>
                </tr>
              ) : (
                targets.map((t) => (
                  <tr
                    key={t.city}
                    className={`border-t border-stone-50 ${
                      t.healthy ? "" : "bg-amber-50/30"
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-stone-900">
                      {t.city}
                      {t.savedSearchHits ? (
                        <span className="ml-1 text-[11px] text-violet-700">
                          · {t.savedSearchHits} alerts
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{t.sitters}</td>
                    <td className="px-3 py-2 tabular-nums">{t.hosts}</td>
                    <td className="px-3 py-2 text-xs text-stone-600">
                      {t.sittersGap > 0 || t.hostsGap > 0
                        ? `need ${t.sittersGap}s / ${t.hostsGap}h`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {t.healthy ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Healthy
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          Thin
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/browse/aupairs?city=${encodeURIComponent(t.city)}`}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Browse
                      </Link>
                      {" · "}
                      <Link
                        href={`/invite`}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Invite
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
