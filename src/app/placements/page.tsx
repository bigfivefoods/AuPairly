import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { PlacementsClient } from "@/components/placements-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placements" };

export default async function PlacementsPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Pipeline"
        title="Placements"
        description="From interest to interview, trial week, and a confirmed placement — with checklist, contract, and success fee."
      />
      <PlacementsClient />
    </div>
  );
}
