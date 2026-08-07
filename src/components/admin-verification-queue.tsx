"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, FileText } from "lucide-react";
import { Avatar, Badge, Button, Card } from "@/components/ui";

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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed");
        return;
      }
      setPending((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoadingId(null);
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

  async function unsuspendUser(userId: string) {
    setLoadingId(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "unsuspend" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unsuspend failed");
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
        <h2 className="font-display text-xl font-semibold">
          Pending verification ({pending.length})
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Approve or reject member checks. Approving ID + selfie unlocks their Verified badge.
        </p>

        {pending.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-stone-500">
            Queue is clear — no pending checks.
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((item) => (
              <Card key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <Avatar name={item.user.name} image={item.user.image} size="md" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-stone-900">{item.user.name}</span>
                      <Badge>{item.user.role === "AUPAIR" ? "Au pair" : "Parent"}</Badge>
                      <Badge variant="warning">{item.type}</Badge>
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
                <div className="flex gap-2">
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
            ))}
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
                    onClick={() =>
                      suspendUser(r.targetId, `Report: ${r.reason}`)
                    }
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
