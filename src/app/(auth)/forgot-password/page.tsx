"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Forgot password</h1>
          <p className="mt-2 text-stone-500">We&apos;ll email you a secure reset link</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            Back to log in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-stone-400">
          In local dev, the link is printed in the server console.
        </p>
      </Card>
    </div>
  );
}
