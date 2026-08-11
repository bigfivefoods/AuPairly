import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { PlacementsClient } from "@/components/placements-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placements" };

export default async function PlacementsPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Pipeline"
        title="Placement board"
        description="Kanban for hosts & sitters: Interested → Interview → Trial → Placed → Completed. Drag cards or use the stage menu. Open a card for checklist, offer letter, and success fee."
      />
      <PlacementsClient />
    </div>
  );
}
