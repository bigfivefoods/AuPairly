"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Button, Input, Label } from "@/components/ui";

export default function CoachPage() {
  const [tips, setTips] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [theirName, setTheirName] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/assist")
      .then((r) => r.json())
      .then((d) => {
        if (d.coach) {
          setTips(d.coach.tips || []);
          setScore(d.coach.score || 0);
        }
      });
  }, []);

  async function draft() {
    const res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theirName, city }),
    });
    const d = await res.json();
    if (d.message) setMessage(d.message);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Assist"
        title="Profile coach & first message"
        description="Instant tips to improve your listing and a polite intro message template."
      />
      <Card>
        <p className="text-sm text-stone-500">Profile strength</p>
        <p className="font-display text-4xl font-semibold text-teal-700">{score}/100</p>
        <ul className="mt-4 space-y-2">
          {tips.map((t) => (
            <li key={t} className="text-sm text-stone-600">
              · {t}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6">
        <h3 className="font-display text-lg font-semibold">Message assist</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Their name</Label>
            <Input value={theirName} onChange={(e) => setTheirName(e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <Button className="mt-3" onClick={draft}>
          Draft first message
        </Button>
        {message && (
          <textarea
            className="input-field mt-4 min-h-[120px]"
            readOnly
            value={message}
          />
        )}
      </Card>
    </div>
  );
}
