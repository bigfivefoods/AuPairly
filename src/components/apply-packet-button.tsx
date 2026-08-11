"use client";

import { useState } from "react";
import { Loader2, FileStack } from "lucide-react";
import { Button } from "@/components/ui";

export function ApplyPacketButton({
  toUserId,
  disabled,
}: {
  toUserId: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId,
          message: "Please find my full application packet (profile, docs & references).",
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setMsg(data.error || "Upgrade to send more applications");
        return;
      }
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg("Application packet sent!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || busy}
        onClick={send}
        className="w-full sm:w-auto"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileStack className="h-4 w-4" />
        )}
        Send application packet
      </Button>
      <p className="mt-1.5 text-[11px] text-stone-500">
        Requires a 1+ minute intro video (Trust page). Cert docs stay owner-only.
      </p>
      {msg && (
        <p className="mt-2 text-xs text-stone-600">
          {msg}{" "}
          {msg.toLowerCase().includes("video") && (
            <a href="/trust" className="font-semibold text-teal-700 underline">
              Add video →
            </a>
          )}
        </p>
      )}
    </div>
  );
}
