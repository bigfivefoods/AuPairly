"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Welcome back</h1>
        <p className="mt-2 text-stone-500">
          Trusted care for your family, loved ones, home &amp; pets.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="!mb-0">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-teal-700 hover:text-teal-800">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        New to AuPairly?{" "}
        <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">
          Create an account
        </Link>
      </p>
      <div className="mt-6 rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
        <p className="font-semibold text-stone-700">Demo accounts</p>
        <p className="mt-1">Parent: parent@demo.aupairly.me / demo1234</p>
        <p>Au pair: aupair@demo.aupairly.me / demo1234</p>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
