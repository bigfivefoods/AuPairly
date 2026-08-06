"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Loader2 } from "lucide-react";

export function StartPlacementButton({ otherUserId }: { otherUserId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (res.ok && data.placement?.id) {
        router.push(`/placements/${data.placement.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={start} disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      Start placement
    </Button>
  );
}
