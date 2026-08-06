"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui";

export function ShortlistButton({ targetUserId }: { targetUserId: string }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    const res = await fetch("/api/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
  }

  return (
    <Button type="button" variant="secondary" disabled={busy || done} onClick={add}>
      <Bookmark className="h-4 w-4" />
      {done ? "On shortlist" : "Shortlist"}
    </Button>
  );
}
