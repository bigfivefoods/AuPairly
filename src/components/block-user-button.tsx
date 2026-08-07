"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";

export function BlockUserButton({
  userId,
  name,
}: {
  userId: string;
  name?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (
      !blocked &&
      !confirm(
        `Block ${name || "this user"}? They won't be able to message you or appear in Discover.`
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: blocked ? "unblock" : "block",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setBlocked(Boolean(data.blocked));
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-stone-800"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}
        {blocked ? "Unblock" : "Block"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {blocked && (
        <p className="mt-1 text-xs text-stone-500">Blocked — they can’t contact you.</p>
      )}
    </div>
  );
}
