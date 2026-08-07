"use client";

import Link from "next/link";
import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Home, HandHeart, Loader2, Mail, ShieldCheck } from "lucide-react";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

type Step = "email" | "otp" | "details";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "PARENT" ? "PARENT" : "AUPAIR";
  const refCode = searchParams.get("ref")?.trim() || "";

  const [step, setStep] = useState<Step>("email");
  const [role, setRole] = useState<"AUPAIR" | "PARENT">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const privyEnabled = Boolean(privyAppId);
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { sendCode, loginWithCode, state: otpState } = useLoginWithEmail({
    onComplete: () => {
      setEmailVerified(true);
      setStep("details");
      setError("");
    },
    onError: (err) => {
      const msg =
        typeof err === "string"
          ? err
          : err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Verification failed. Try again.";
      setError(msg || "Verification failed. Try again.");
      setLoading(false);
    },
  });

  // If already authenticated with Privy on this email, skip to details
  useEffect(() => {
    if (!privyEnabled || !ready || !authenticated || !user) return;
    const linked = user.email?.address?.toLowerCase();
    if (linked) {
      setEmail(linked);
      setEmailVerified(true);
      setStep("details");
    }
  }, [privyEnabled, ready, authenticated, user]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const addr = email.trim().toLowerCase();
    if (!addr || !addr.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!privyEnabled) {
      setError(
        "Email verification is not configured yet. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET."
      );
      return;
    }
    setLoading(true);
    try {
      // Clear any previous Privy session so OTP is for this email
      if (authenticated) {
        try {
          await logout();
        } catch {
          /* ignore */
        }
      }
      await sendCode({ email: addr });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await loginWithCode({ code: code.trim() });
      // onComplete advances to details
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Please accept the Terms of Service and Platform Disclaimer to continue.");
      return;
    }
    if (privyEnabled && !emailVerified && !authenticated) {
      setError("Please verify your email before creating an account.");
      setStep("email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let privyAccessToken: string | undefined;
      if (privyEnabled) {
        const token = await getAccessToken();
        if (!token) {
          setError("Email session expired. Please verify your email again.");
          setEmailVerified(false);
          setStep("email");
          setLoading(false);
          return;
        }
        privyAccessToken = token;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role,
          privyAccessToken,
          ...(refCode ? { refCode } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      const login = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      // Ruthless path: always land in photo → city → publish wizard
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (privyEnabled && !ready) {
    return (
      <Card className="w-full max-w-lg text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
        <p className="mt-4 text-sm text-stone-500">Loading secure verification…</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Join AuPairly</h1>
        <p className="mt-2 text-stone-500">
          Trusted care for your family, loved ones, home &amp; pets.
        </p>
        {refCode && (
          <p className="mt-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            You were invited — welcome!
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold">
        {(
          [
            ["email", "1. Email"],
            ["otp", "2. Code"],
            ["details", "3. Account"],
          ] as const
        ).map(([id, label], i) => {
          const active =
            step === id ||
            (step === "otp" && id === "email") ||
            (step === "details" && (id === "email" || id === "otp"));
          const current = step === id;
          return (
            <span key={id} className="flex items-center gap-2">
              {i > 0 && <span className="text-stone-300">→</span>}
              <span
                className={cn(
                  "rounded-full px-2.5 py-1",
                  current
                    ? "bg-teal-600 text-white"
                    : active
                      ? "bg-teal-50 text-teal-800"
                      : "bg-stone-100 text-stone-400"
                )}
              >
                {label}
              </span>
            </span>
          );
        })}
      </div>

      {!privyEnabled && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Privy is not configured. Set <code className="text-xs">NEXT_PUBLIC_PRIVY_APP_ID</code> and{" "}
          <code className="text-xs">PRIVY_APP_SECRET</code> to require email verification. Registration
          is blocked until email OTP is enabled.
        </div>
      )}

      {/* Step 1: email */}
      {step === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-sm text-teal-900">
            <p className="flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4" /> Verify your email first
            </p>
            <p className="mt-1 text-teal-800/90">
              We&apos;ll send a one-time code via Privy. You can only create an account after the
              address is verified.
            </p>
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
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !privyEnabled}
            className="w-full"
            variant="primary"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send verification code
          </Button>
        </form>
      )}

      {/* Step 2: OTP */}
      {step === "otp" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-sm text-teal-900">
            Code sent to <strong>{email}</strong>. Check your inbox (and spam).
          </div>
          <div>
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || otpState.status === "submitting-code"}
            className="w-full"
            variant="primary"
          >
            {(loading || otpState.status === "submitting-code") && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Verify email
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm font-semibold text-teal-700 hover:underline"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
          >
            Change email / resend
          </button>
        </form>
      )}

      {/* Step 3: account details */}
      {step === "details" && (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              Email verified: <strong>{email}</strong>
            </span>
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
              <span className="text-sm font-semibold">I need help</span>
              <span className="text-center text-[11px] font-normal opacity-80">
                Host / family · hire sitters
              </span>
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
              <HandHeart className="h-6 w-6" />
              <span className="text-sm font-semibold">I offer services</span>
              <span className="text-center text-[11px] font-normal opacity-80">
                Sitter · childcare, house &amp; pets
              </span>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <label className="flex items-start gap-2.5 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-teal-600"
                required
              />
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-teal-700 hover:underline"
                  target="_blank"
                >
                  Terms of Service
                </Link>
                ,{" "}
                <Link
                  href="/disclaimer"
                  className="font-semibold text-teal-700 hover:underline"
                  target="_blank"
                >
                  Platform Disclaimer
                </Link>
                , and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-teal-700 hover:underline"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full"
              variant={role === "AUPAIR" ? "accent" : "primary"}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create {role === "PARENT" ? "host" : "sitter"} account
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">
          Log in
        </Link>
      </p>
    </Card>
  );
}

/** Fallback when Privy SDK hooks cannot mount (no provider) */
function RegisterWithoutPrivy() {
  return (
    <Card className="w-full max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-stone-900">Email verification required</h1>
      <p className="mt-3 text-sm text-stone-600">
        AuPairly uses <strong>Privy</strong> to verify email before registration. Add these to
        Vercel / <code className="text-xs">.env</code>:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-600">
        <li>
          <code className="text-xs">NEXT_PUBLIC_PRIVY_APP_ID</code> — from{" "}
          <a
            href="https://dashboard.privy.io"
            className="font-semibold text-teal-700 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            dashboard.privy.io
          </a>
        </li>
        <li>
          <code className="text-xs">PRIVY_APP_SECRET</code> — server secret (never public)
        </li>
        <li>
          Enable <strong>Email</strong> login method in the Privy dashboard
        </li>
      </ul>
      <p className="mt-4 text-sm text-stone-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-teal-700 hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}

function RegisterGate() {
  if (!privyAppId) {
    return <RegisterWithoutPrivy />;
  }
  return <RegisterForm />;
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        }
      >
        <RegisterGate />
      </Suspense>
    </div>
  );
}
