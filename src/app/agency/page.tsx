"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Label, PageHeader, Badge } from "@/components/ui";

export default function AgencyPage() {
  const [agency, setAgency] = useState<{ name: string; slug: string; plan: string } | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/agency");
    const d = await res.json();
    if (res.ok) {
      setAgency(d.agency);
      setMembers(d.members || []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/agency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="B2B"
        title="Agency mode"
        description="Manage multiple au pairs under one agency brand. Starter plan free to try; Pro seats coming soon."
      />
      {!agency ? (
        <Card>
          <form onSubmit={create} className="space-y-3">
            <Label>Agency name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit">Create agency</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{agency.name}</h2>
            <Badge>{agency.plan}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-500">Slug: {agency.slug}</p>
          <h3 className="mt-6 font-semibold">Members</h3>
          <ul className="mt-2 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="text-sm text-stone-700">
                {m.name} · {m.role}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
