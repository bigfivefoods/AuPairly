"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    if (confirm !== "DELETE") {
      setError('Type DELETE in capitals to confirm.');
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Delete failed");
        return;
      }
      router.push("/login?deleted=1");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-8 border-red-200 bg-red-50/40">
      <h3 className="font-display text-lg font-semibold text-red-950">
        Delete account (POPIA)
      </h3>
      <p className="mt-1 text-sm text-red-900/80">
        Permanently removes your profile, messages, and personal data. This cannot
        be undone. Legal holds (e.g. open fraud cases) may retain limited records.
      </p>
      <div className="mt-4">
        <Label>Type DELETE to confirm</Label>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="mt-3 border-red-300 text-red-800 hover:bg-red-100"
        disabled={busy || confirm !== "DELETE"}
        onClick={onDelete}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Delete my account
      </Button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </Card>
  );
}
