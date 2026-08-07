import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { FacebookConnect } from "@/components/facebook-connect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connected accounts" };

export default async function ConnectionsSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Settings"
        title="Connected accounts"
        description="Link social profiles to prefill your name and photo. Government ID verification is still required for a Verified badge."
      />

      <Suspense fallback={<div className="py-8 text-center text-sm text-stone-400">Loading…</div>}>
        <FacebookConnect returnTo="/settings/connections" />
      </Suspense>

      <div className="mt-8 space-y-3 text-sm text-stone-500">
        <p>
          <Link href="/verification" className="font-semibold text-teal-700 hover:underline">
            Complete identity verification →
          </Link>
        </p>
        <p>
          <Link href="/profile/edit" className="font-semibold text-teal-700 hover:underline">
            Edit profile →
          </Link>
        </p>
        <p>
          <Link href="/dashboard" className="font-semibold text-teal-700 hover:underline">
            Back to dashboard →
          </Link>
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs leading-relaxed text-stone-500">
        <p className="font-semibold text-stone-800">Meta App setup (admins)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            Create an app at{" "}
            <a
              href="https://developers.facebook.com/apps/"
              className="font-medium text-teal-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              developers.facebook.com
            </a>
          </li>
          <li>Add product: <strong>Facebook Login</strong> for Web</li>
          <li>
            Valid OAuth Redirect URI:{" "}
            <code className="rounded bg-white px-1">
              https://www.aupairly.me/api/social/facebook/callback
            </code>
          </li>
          <li>
            App Domains: <code className="rounded bg-white px-1">aupairly.me</code>
          </li>
          <li>
            Env: <code className="rounded bg-white px-1">NEXT_PUBLIC_FACEBOOK_APP_ID</code> +{" "}
            <code className="rounded bg-white px-1">AUTH_FACEBOOK_SECRET</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
