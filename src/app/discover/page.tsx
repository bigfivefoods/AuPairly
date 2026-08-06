import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { DiscoverClient } from "@/components/discover-client";
import { getUserPlan } from "@/lib/entitlements";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const { planId, plan } = await getUserPlan(user.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Discover
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-stone-900">
          Swipe to match
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Mutual likes open a chat. Plan:{" "}
          <Link href="/billing" className="font-semibold text-teal-700 hover:underline">
            {plan.name}
          </Link>
          {plan.limits.swipesPerDay > 0 && (
            <span className="text-stone-400">
              {" "}
              · {plan.limits.swipesPerDay} swipes/day on free
            </span>
          )}
        </p>
      </div>
      <DiscoverClient role={user.role} planId={planId} />
    </div>
  );
}
