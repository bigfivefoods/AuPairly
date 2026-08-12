"use client";

import { useState } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { Loader2, CheckCircle2 } from "lucide-react";

export function NotificationPrefsForm({
  initial,
}: {
  initial: {
    emailPrefMessages: string;
    whatsappAlerts: boolean;
    phone: string;
  };
}) {
  const [emailPref, setEmailPref] = useState(initial.emailPrefMessages || "INSTANT");
  const [wa, setWa] = useState(initial.whatsappAlerts);
  const [phone, setPhone] = useState(initial.phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailPrefMessages: emailPref,
          whatsappAlerts: wa,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Save failed");
        return;
      }
      setMsg("Preferences saved.");
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Email alerts</h3>
      <div>
        <Label>Messages & matching emails</Label>
        <Select value={emailPref} onChange={(e) => setEmailPref(e.target.value)}>
          <option value="INSTANT">Instant</option>
          <option value="DAILY">Daily digest only</option>
          <option value="OFF">Off (in-app only)</option>
        </Select>
        <p className="mt-1 text-xs text-stone-500">
          Ops/management emails (if you&apos;re on the team) are always sent.
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={wa}
          onChange={(e) => setWa(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-stone-300 text-teal-600"
        />
        <span>
          <span className="font-semibold">WhatsApp-style phone alerts</span>
          <span className="block text-xs text-stone-500">
            Opt-in to SMS/WhatsApp-ready alerts on your phone number (delivery via future
            gateway; we store preference now).
          </span>
        </span>
      </label>
      {wa && (
        <div>
          <Label>Phone (WhatsApp)</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27…"
          />
        </div>
      )}
      <Button type="button" disabled={busy} onClick={save}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save preferences
      </Button>
      {msg && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}
    </Card>
  );
}
