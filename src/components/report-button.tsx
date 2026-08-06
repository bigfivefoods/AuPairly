"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ReportButton({ targetId }: { targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Suspicious or unsafe behavior");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not report");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-xs text-stone-500">Report received — thank you.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report profile
      </button>
      {open && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <select
            className="input-field text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option>Suspicious or unsafe behavior</option>
            <option>Fake or misleading profile</option>
            <option>Harassment or spam</option>
            <option>Inappropriate content</option>
            <option>Other</option>
          </select>
          <textarea
            className="input-field min-h-[70px] text-sm"
            placeholder="Optional details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="button" variant="danger" disabled={loading} onClick={submit} className="!py-1.5 !text-sm">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit report
          </Button>
        </div>
      )}
    </div>
  );
}
