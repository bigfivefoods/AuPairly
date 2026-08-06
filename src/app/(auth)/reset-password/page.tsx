"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-stone-500">This reset link is missing a token.</p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Set new password</h1>
        <p className="mt-2 text-stone-500">Choose a strong password (8+ characters)</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
