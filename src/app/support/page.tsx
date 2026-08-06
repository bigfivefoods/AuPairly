"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, PageHeader, Textarea, Badge } from "@/components/ui";

export default function SupportPage() {
  const [tickets, setTickets] = useState<
    { id: string; subject: string; body: string; status: string; reply?: string | null }[]
  >([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/support");
    const d = await res.json();
    if (res.ok) setTickets(d.tickets || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "Failed");
      return;
    }
    setSubject("");
    setBody("");
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Help"
        title="Priority support"
        description="Plus & Premium members can open tickets. Free users — upgrade for faster help."
      />
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          {error && (
            <p className="text-sm text-amber-800">
              {error}{" "}
              {error.includes("Upgrade") && (
                <Link href="/pricing" className="font-semibold underline">
                  View plans
                </Link>
              )}
            </p>
          )}
          <Button type="submit">Submit ticket</Button>
        </form>
      </Card>
      <ul className="mt-6 space-y-3">
        {tickets.map((t) => (
          <Card key={t.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{t.subject}</p>
              <Badge>{t.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-stone-600">{t.body}</p>
            {t.reply && (
              <p className="mt-3 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
                Support: {t.reply}
              </p>
            )}
          </Card>
        ))}
      </ul>
    </div>
  );
}
