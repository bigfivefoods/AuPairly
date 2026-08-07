"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

/** One-tap save current browse filters as an alert */
export function SaveSearchButton({
  name,
  filters,
  isLoggedIn,
}: {
  name: string;
  filters: Record<string, string>;
  isLoggedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    if (!isLoggedIn) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.slice(0, 80),
          filters,
          alertEnabled: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not save");
        return;
      }
      setMsg("Saved — we’ll email new matches");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        onClick={save}
        disabled={loading}
        className="min-h-9"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        Alert me
      </Button>
      {msg && <p className="text-xs font-medium text-teal-800">{msg}</p>}
    </div>
  );
}
