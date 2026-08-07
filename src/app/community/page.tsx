import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommunityClient } from "@/components/community-client";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "AuPair Connect — sitters near you",
  description:
    "Meet other au pairs and sitters in your city. Make friends abroad, share tips, and connect with peers on AuPairly.",
  path: "/community",
  noIndex: true,
});

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/community");
  }

  if (session.user.role === "PARENT") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-stone-900">
          AuPair Connect is for sitters
        </h1>
        <p className="mt-3 text-stone-600">
          This space helps au pairs and sitters make friends in the same area while
          abroad. Hosts can browse sitters from Discover or Browse.
        </p>
        <Link href="/discover" className="btn-primary mt-6 inline-flex">
          Discover sitters
        </Link>
      </div>
    );
  }

  if (session.user.role !== "AUPAIR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const profile = await prisma.auPairProfile.findUnique({
    where: { userId: session.user.id },
    select: { city: true, region: true, country: true, openToPeerConnect: true },
  });

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-stone-500">Loading community…</div>
      }
    >
      <CommunityClient
        meLocation={{
          city: profile?.city,
          region: profile?.region,
          country: profile?.country,
        }}
      />
    </Suspense>
  );
}
