"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader } from "@/components/ui";

function AppsInner() {
  const sp = useSearchParams();
  const box = sp.get("box") === "sent" ? "sent" : "received";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/applications?box=${box}`);
    const data = await res.json();
    if (res.ok) setApps(data.applications || []);
    setLoading(false);
  }, [box]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Apply"
        title="Application packets"
        description="Full applications with video, docs, and references in one place."
      />
      <div className="mb-6 flex gap-2">
        <Link
          href="/applications"
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            box === "received" ? "bg-teal-600 text-white" : "bg-stone-100 text-stone-700"
          }`}
        >
          Received
        </Link>
        <Link
          href="/applications?box=sent"
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            box === "sent" ? "bg-teal-600 text-white" : "bg-stone-100 text-stone-700"
          }`}
        >
          Sent
        </Link>
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
      ) : apps.length === 0 ? (
        <Card className="text-center text-sm text-stone-500">
          No applications yet. Au pairs can send a packet from a family profile.
        </Card>
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => {
            const person = box === "sent" ? a.toUser : a.fromUser;
            const packet = a.packet || {};
            return (
              <Card key={a.id}>
                <div className="flex items-start gap-3">
                  <Avatar name={person.name} image={person.image} size="md" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{person.name}</p>
                      <Badge>{a.status}</Badge>
                      {packet.safetyScore != null && (
                        <Badge variant="success">Trust {packet.safetyScore}</Badge>
                      )}
                    </div>
                    {a.message && (
                      <p className="mt-2 text-sm text-stone-600">{a.message}</p>
                    )}
                    <div className="mt-2 text-xs text-stone-500">
                      {packet.headline && <p>{packet.headline}</p>}
                      {packet.city && (
                        <p>
                          {packet.city}
                          {packet.country ? `, ${packet.country}` : ""}
                        </p>
                      )}
                      {packet.videoUrl && (
                        <p>
                          Video:{" "}
                          <a href={packet.videoUrl} className="text-teal-700 underline" target="_blank" rel="noreferrer">
                            watch intro
                          </a>
                        </p>
                      )}
                      {Array.isArray(packet.documents) && packet.documents.length > 0 && (
                        <p>Docs: {packet.documents.map((d: { type: string }) => d.type).join(", ")}</p>
                      )}
                      {Array.isArray(packet.references) && (
                        <p>{packet.references.length} reference(s)</p>
                      )}
                      {packet.workRights && <p>Work rights: {packet.workRights}</p>}
                    </div>
                    {box === "received" && a.status === "SENT" && (
                      <div className="mt-3 flex gap-2">
                        <Button className="!text-xs" onClick={() => setStatus(a.id, "ACCEPTED")}>
                          Accept
                        </Button>
                        <Button
                          variant="secondary"
                          className="!text-xs"
                          onClick={() => setStatus(a.id, "DECLINED")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <AppsInner />
    </Suspense>
  );
}
