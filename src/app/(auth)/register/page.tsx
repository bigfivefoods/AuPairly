"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Home, Globe2, Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "PARENT" ? "PARENT" : "AUPAIR";
  const [role, setRole] = useState<"AUPAIR" | "PARENT">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Join AuPairly</h1>
        <p className="mt-2 text-stone-500">Create your free account in under a minute</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("PARENT")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition",
            role === "PARENT"
              ? "border-teal-600 bg-teal-50 text-teal-900"
              : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-sm font-semibold">I&apos;m a parent</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("AUPAIR")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition",
            role === "AUPAIR"
              ? "border-orange-500 bg-orange-50 text-orange-900"
              : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
          )}
        >
          <Globe2 className="h-6 w-6" />
          <span className="text-sm font-semibold">I&apos;m an au pair</span>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "PARENT" ? "Alex Rivera" : "Sofia Mendes"}
          />
        </div>
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
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full" variant={role === "AUPAIR" ? "accent" : "primary"}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create {role === "PARENT" ? "parent" : "au pair"} account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Log in
        </Link>
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
