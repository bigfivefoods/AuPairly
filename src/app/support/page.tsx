"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Textarea,
  Badge,
  Select,
} from "@/components/ui";
import { ContactUs } from "@/components/contact-us";

const FREE_CATEGORIES = [
  { value: "SAFETY", label: "Safety concern (free)" },
  { value: "ABUSE", label: "Abuse / harassment (free)" },
  { value: "ACCOUNT_ACCESS", label: "Account access (free)" },
  { value: "REPORT", label: "Report a listing (free)" },
  { value: "GENERAL", label: "General / product help (Plus+)" },
] as const;

export default function SupportPage() {
  const [tickets, setTickets] = useState<
    { id: string; subject: string; body: string; status: string; reply?: string | null }[]
  >([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("SAFETY");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

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
    setOkMsg("");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, category }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "Failed");
      return;
    }
    setSubject("");
    setBody("");
    setOkMsg("Ticket submitted — we’ll reply as soon as we can.");
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Help"
        title="Contact us & support"
        description="Email or WhatsApp anytime. Safety, abuse, and account issues are free for every plan."
      />

      <ContactUs className="mb-8" />

      <Card>
        <h3 className="font-display text-lg font-semibold text-stone-900">
          In-app support ticket
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          Free accounts can open tickets for safety, abuse, account access, and reports.
          Priority product help is included on Plus &amp; Premium.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {FREE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          {okMsg && <p className="text-sm text-emerald-700">{okMsg}</p>}
          {error && (
            <p className="text-sm text-amber-800">
              {error}{" "}
              {(error.includes("Upgrade") || error.includes("Plus")) && (
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
