"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader } from "@/components/ui";
import { responseTimeLabel } from "@/lib/completeness";

type Item = {
  id: string;
  notes: string | null;
  targetType: string;
  targetProfileId: string | null;
  matchScore: number;
  matchReasons: string[];
  user: {
    id: string;
    name: string;
    image?: string | null;
    safetyScore: number;
    avgResponseMinutes?: number | null;
    placementVerified?: boolean;
  };
  profile: {
    headline?: string | null;
    city?: string | null;
    country?: string | null;
    isVerified?: boolean;
    experienceYears?: number;
    pocketMoneyMin?: number | null;
    pocketMoney?: number | null;
    childrenCount?: number;
    schoolArea?: string | null;
    drivingLicense?: boolean;
    firstAid?: boolean;
    workRights?: string | null;
    weeklyHours?: number | null;
    liveIn?: boolean;
  } | null;
};

export default function ShortlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shortlist");
    const data = await res.json();
    if (res.ok) setItems(data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(targetUserId: string) {
    await fetch(`/api/shortlist?targetUserId=${targetUserId}`, { method: "DELETE" });
    setItems((x) => x.filter((i) => i.user.id !== targetUserId));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Compare"
        title="Your shortlist"
        description="Side-by-side comparison of candidates you saved from Discover or browse."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center">
          <p className="text-stone-600">No one shortlisted yet.</p>
          <Link href="/discover" className="btn-primary mt-4 inline-flex">
            Open Discover
          </Link>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="p-3">Profile</th>
                <th className="p-3">Match</th>
                <th className="p-3">Location</th>
                <th className="p-3">Details</th>
                <th className="p-3">Trust</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-stone-100 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={it.user.name} image={it.user.image} size="md" />
                      <div>
                        <p className="font-semibold text-stone-900">{it.user.name}</p>
                        <p className="text-xs text-stone-500">{it.profile?.headline}</p>
                        {it.targetProfileId && (
                          <Link
                            href={
                              it.targetType === "AUPAIR"
                                ? `/browse/aupairs/${it.targetProfileId}`
                                : `/browse/families/${it.targetProfileId}`
                            }
                            className="text-xs font-semibold text-teal-700"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="success">{it.matchScore}%</Badge>
                    <ul className="mt-1 space-y-0.5 text-xs text-stone-500">
                      {it.matchReasons.slice(0, 2).map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-3 text-stone-600">
                    {[it.profile?.city, it.profile?.country].filter(Boolean).join(", ") || "—"}
                    {it.profile?.schoolArea && (
                      <p className="text-xs">School: {it.profile.schoolArea}</p>
                    )}
                  </td>
                  <td className="p-3 text-stone-600">
                    {it.targetType === "AUPAIR" ? (
                      <>
                        <p>{it.profile?.experienceYears ?? 0}+ yrs exp</p>
                        {it.profile?.pocketMoneyMin != null && (
                          <p>from R{it.profile.pocketMoneyMin}/wk</p>
                        )}
                        <p className="text-xs">
                          {it.profile?.drivingLicense ? "Drives · " : ""}
                          {it.profile?.firstAid ? "First aid · " : ""}
                          {it.profile?.workRights || ""}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>{it.profile?.childrenCount ?? "?"} children</p>
                        {it.profile?.pocketMoney != null && (
                          <p>R{it.profile.pocketMoney}/wk pocket money</p>
                        )}
                      </>
                    )}
                    {it.profile?.weeklyHours != null && (
                      <p className="text-xs">{it.profile.weeklyHours}h / week</p>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{it.user.safetyScore}</p>
                    {it.profile?.isVerified && <Badge variant="success">Verified</Badge>}
                    {responseTimeLabel(it.user.avgResponseMinutes) && (
                      <p className="mt-1 text-[11px] text-stone-500">
                        {responseTimeLabel(it.user.avgResponseMinutes)}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="secondary"
                      className="!px-2 !py-1"
                      onClick={() => remove(it.user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
