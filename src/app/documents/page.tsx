"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";

type Doc = {
  id: string;
  type: string;
  label?: string | null;
  url: string;
  expiresAt?: string | null;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [type, setType] = useState("PASSPORT");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const d = await res.json();
    if (res.ok) setDocs(d.documents || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, url, expiresAt: expiresAt || undefined }),
    });
    setUrl("");
    setLabel("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Vault"
        title="Document vault"
        description="Private links to passport, police clearance, first aid — with optional expiry reminders."
      />
      <Card>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PASSPORT">Passport</option>
              <option value="POLICE">Police clearance</option>
              <option value="FIRST_AID">First aid</option>
              <option value="VISA">Visa</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Secure URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..." />
          </div>
          <div>
            <Label>Expires</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add document
            </Button>
          </div>
        </form>
      </Card>
      <ul className="mt-6 space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="flex items-center justify-between gap-3 !py-4">
            <div>
              <p className="font-semibold">
                {d.type} {d.label ? `· ${d.label}` : ""}
              </p>
              <a href={d.url} className="text-xs text-teal-700 break-all" target="_blank" rel="noreferrer">
                {d.url}
              </a>
              {d.expiresAt && (
                <p className="text-xs text-amber-700 mt-1">
                  Expires {new Date(d.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="ghost" onClick={() => remove(d.id)}>
              Remove
            </Button>
          </Card>
        ))}
      </ul>
    </div>
  );
}
