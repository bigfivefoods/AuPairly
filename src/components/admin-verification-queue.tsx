"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, FileText, Clock } from "lucide-react";
import { Avatar, Badge, Button, Card, Label, Select, Textarea } from "@/components/ui";

type PendingItem = {
  id: string;
  type: string;
  status: string;
  documentUrl: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
};

type ReportItem = {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
};

const REJECT_TEMPLATES = [
  { id: "blurry", label: "Document / selfie blurry or unreadable" },
  { id: "mismatch", label: "Face / ID mismatch" },
  { id: "expired", label: "Document expired" },
  { id: "wrong", label: "Wrong document type" },
  { id: "crop", label: "Please re-upload full document (all corners visible)" },
  { id: "custom", label: "Custom reason…" },
];

function ageHours(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
}

export function AdminVerificationQueue({
  initialPending,
  initialReports,
}: {
  initialPending: PendingItem[];
  initialReports: ReportItem[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(initialPending);
  const [reports] = useState(initialReports);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejectTemplate, setRejectTemplate] = useState(REJECT_TEMPLATES[0].id);
  const [customReason, setCustomReason] = useState("");

  const rejectNotes = useMemo(() => {
    if (rejectTemplate === "custom") return customReason.trim();
    return (
      REJECT_TEMPLATES.find((t) => t.id === rejectTemplate)?.label ||
      "Please re-upload clearer documents"
    );
  }, [rejectTemplate, customReason]);

  const staleCount = pending.filter((p) => ageHours(p.createdAt) >= 36).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map((p) => p.id)));
  }

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !rejectNotes) {
      setError("Pick or type a rejection reason first");
      return;
    }
    setLoadingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          notes: action === "reject" ? rejectNotes : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed");
        return;
      }
      setPending((p) => p.filter((x) => x.id !== id));
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  async function bulkAct(action: "approve" | "reject") {
    if (!selected.size) return;
    if (action === "reject" && !rejectNotes) {
      setError("Pick or type a rejection reason for bulk reject");
      return;
    }
    setBulkBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selected],
          action,
          notes: action === "reject" ? rejectNotes : "Bulk approved",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Bulk action failed");
        return;
      }
      const okIds = new Set(
        (data.results || [])
          .filter((r: { ok: boolean; id: string }) => r.ok)
          .map((r: { id: string }) => r.id)
      );
      setPending((p) => p.filter((x) => !okIds.has(x.id)));
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setBulkBusy(false);
    }
  }

  async function suspendUser(userId: string, reason?: string) {
    setLoadingId(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: "suspend",
          reason: reason || "Open safety report",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suspend failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Pending verification ({pending.length})
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Target: clear within 36h. Approving ID + selfie unlocks Verified.
              {staleCount > 0 && (
                <span className="ml-1 font-semibold text-amber-800">
                  {staleCount} older than 36h.
                </span>
              )}
            </p>
          </div>
        </div>

        {pending.length > 0 && (
          <Card className="mt-4 space-y-3 !p-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={selected.size === pending.length && pending.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-stone-300 text-teal-600"
                />
                Select all ({selected.size})
              </label>
              <Button
                type="button"
                variant="primary"
                disabled={!selected.size || bulkBusy}
                onClick={() => bulkAct("approve")}
              >
                {bulkBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Bulk approve
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!selected.size || bulkBusy}
                onClick={() => bulkAct("reject")}
              >
                <X className="h-4 w-4" />
                Bulk reject
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Rejection reason template</Label>
                <Select
                  value={rejectTemplate}
                  onChange={(e) => setRejectTemplate(e.target.value)}
                >
                  {REJECT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              {rejectTemplate === "custom" && (
                <div>
                  <Label>Custom reason</Label>
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={2}
                    placeholder="Explain what to fix…"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {pending.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-stone-500">
            Queue is clear — no pending checks.
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((item) => {
              const hours = ageHours(item.createdAt);
              const hot = hours >= 36;
              return (
                <Card
                  key={item.id}
                  className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
                    hot ? "border-amber-300 bg-amber-50/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-2 h-4 w-4 rounded border-stone-300 text-teal-600"
                      aria-label={`Select ${item.user.name}`}
                    />
                    <Avatar name={item.user.name} image={item.user.image} size="md" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          {item.user.name}
                        </span>
                        <Badge>
                          {item.user.role === "AUPAIR" ? "Au pair" : "Parent"}
                        </Badge>
                        <Badge variant="warning">{item.type}</Badge>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            hot
                              ? "bg-amber-100 text-amber-900"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {hours}h in queue
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">{item.user.email}</p>
                      {item.documentUrl && (
                        <a
                          href={item.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View document
                        </a>
                      )}
                      {item.notes && (
                        <p className="mt-1 text-xs text-stone-400">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pl-7 sm:pl-0">
                    <Button
                      variant="primary"
                      disabled={loadingId === item.id}
                      onClick={() => act(item.id, "approve")}
                    >
                      {loadingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      disabled={loadingId === item.id}
                      onClick={() => act(item.id, "reject")}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">
          Open reports ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-stone-500">No open reports.</Card>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{r.reason}</Badge>
                  <span className="text-xs text-stone-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  Reporter: <code className="text-xs">{r.reporterId}</code> · Target:{" "}
                  <code className="text-xs">{r.targetId}</code>
                </p>
                {r.details && (
                  <p className="mt-1 text-sm text-stone-500">{r.details}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    disabled={loadingId === r.targetId}
                    onClick={() => suspendUser(r.targetId, `Report: ${r.reason}`)}
                  >
                    {loadingId === r.targetId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Suspend target
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
