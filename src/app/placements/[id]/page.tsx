import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { PlacementDetailClient } from "@/components/placement-detail-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placement" };

export default async function PlacementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Placement"
        title="Pipeline detail"
        description="Update status, schedule interviews, track trial, edit contract, pay success fee."
      />
      <PlacementDetailClient id={id} />
    </div>
  );
}
