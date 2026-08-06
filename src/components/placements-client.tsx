"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { PLACEMENT_LABELS } from "@/lib/placement-constants";

type PlacementRow = {
  id: string;
  status: string;
  parent: { id: string; name: string };
  aupair: { id: string; name: string };
  successFeePaidAt?: string | null;
  interviewAt?: string | null;
};

export function PlacementsClient() {
  const [rows, setRows] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/placements");
    const data = await res.json();
    if (res.ok) setRows(data.placements || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-display text-xl font-semibold">No placements yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Start one from a profile or after a Discover match — track interview → trial → placed.
        </p>
        <Link href="/discover" className="btn-primary mt-6 inline-flex">
          Open Discover
        </Link>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((p) => (
        <Card key={p.id} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-stone-900">
              {p.parent.name} ↔ {p.aupair.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="success">{PLACEMENT_LABELS[p.status] || p.status}</Badge>
              {p.successFeePaidAt && <Badge>Success fee paid</Badge>}
              {p.interviewAt && (
                <Badge variant="warning">
                  Interview {new Date(p.interviewAt).toLocaleString()}
                </Badge>
              )}
            </div>
          </div>
          <Link href={`/placements/${p.id}`}>
            <Button variant="secondary">Open pipeline</Button>
          </Link>
        </Card>
      ))}
    </ul>
  );
}
