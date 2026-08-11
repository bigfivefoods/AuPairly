"use client";

/**
 * Host placement Kanban: Interested → Interview → Trial → Placed → Completed
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, GripVertical } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  PLACEMENT_LABELS,
  PLACEMENT_STATUSES,
  type PlacementStatus,
} from "@/lib/placement-constants";
import { cn } from "@/lib/utils";

type PlacementRow = {
  id: string;
  status: string;
  parent: { id: string; name: string; image?: string | null };
  aupair: { id: string; name: string; image?: string | null };
  successFeePaidAt?: string | null;
  interviewAt?: string | null;
  updatedAt?: string;
};

const COLUMNS: PlacementStatus[] = [
  "INTERESTED",
  "INTERVIEW",
  "TRIAL",
  "PLACED",
  "COMPLETED",
];

export function PlacementsClient() {
  const [rows, setRows] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

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

  const byStatus = useMemo(() => {
    const map: Record<string, PlacementRow[]> = {};
    for (const s of COLUMNS) map[s] = [];
    map.CANCELLED = [];
    for (const p of rows) {
      const key = COLUMNS.includes(p.status as PlacementStatus)
        ? p.status
        : p.status === "CANCELLED"
          ? "CANCELLED"
          : "INTERESTED";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [rows]);

  async function moveTo(id: string, status: PlacementStatus) {
    setMoving(id);
    setError("");
    // Optimistic
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    try {
      const res = await fetch(`/api/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update status");
        await load();
        return;
      }
    } catch {
      setError("Network error");
      await load();
    } finally {
      setMoving(null);
    }
  }

  function onDrop(status: PlacementStatus) {
    if (!dragId) return;
    const row = rows.find((r) => r.id === dragId);
    if (row && row.status !== status) {
      void moveTo(dragId, status);
    }
    setDragId(null);
  }

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
          Start one from a profile after shortlist — then drag cards across the board:
          Interested → Interview → Trial → Placed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/discover" className="btn-primary">
            Open Discover
          </Link>
          <Link href="/shortlist" className="btn-secondary">
            Shortlist
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Drag cards between columns or use the stage menu. Open a card for checklist, offer, and
        success fee.
      </p>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {COLUMNS.map((status) => (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col rounded-2xl border border-stone-200 bg-stone-50/80"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(status)}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-3 py-2.5">
              <h3 className="text-sm font-semibold text-stone-800">
                {PLACEMENT_LABELS[status] || status}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-stone-500 ring-1 ring-stone-200">
                {(byStatus[status] || []).length}
              </span>
            </div>
            <ul className="flex min-h-[120px] flex-col gap-2 p-2">
              {(byStatus[status] || []).map((p) => (
                <li
                  key={p.id}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "rounded-xl border border-stone-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing",
                    dragId === p.id && "opacity-60 ring-2 ring-teal-400",
                    moving === p.id && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {p.parent.name} ↔ {p.aupair.name}
                      </p>
                      {p.interviewAt && (
                        <p className="mt-0.5 text-[11px] text-amber-700">
                          Interview {new Date(p.interviewAt).toLocaleString()}
                        </p>
                      )}
                      {p.successFeePaidAt && (
                        <Badge className="mt-1" variant="success">
                          Fee paid
                        </Badge>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Link
                          href={`/placements/${p.id}`}
                          className="text-xs font-semibold text-teal-700 hover:underline"
                        >
                          Open →
                        </Link>
                        <select
                          className="max-w-full rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-stone-600"
                          value={p.status}
                          disabled={moving === p.id}
                          onChange={(e) =>
                            moveTo(p.id, e.target.value as PlacementStatus)
                          }
                        >
                          {PLACEMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {PLACEMENT_LABELS[s] || s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {(byStatus[status] || []).length === 0 && (
                <li className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center text-xs text-stone-400">
                  Drop here
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {(byStatus.CANCELLED || []).length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-stone-500">Cancelled</h3>
          <ul className="flex flex-wrap gap-2">
            {byStatus.CANCELLED.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/placements/${p.id}`}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-teal-200"
                >
                  {p.parent.name} ↔ {p.aupair.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
