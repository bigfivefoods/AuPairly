import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { InterestActions } from "@/components/interest-actions";
import { Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";
export const metadata = { title: "Interests" };

export default async function InterestsPage() {
  const user = await requireUser();

  const [received, sent] = await Promise.all([
    prisma.interest.findMany({
      where: { toUserId: user.id },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            aupairProfile: { select: { id: true, headline: true } },
            familyProfile: { select: { id: true, familyName: true, headline: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interest.findMany({
      where: { fromUserId: user.id },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            aupairProfile: { select: { id: true, headline: true } },
            familyProfile: { select: { id: true, familyName: true, headline: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Matching"
        title="Interests & applications"
        description="Manage who wants to match with you, and track the interest you've sent."
      />

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold">Received</h2>
        {received.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="No interests yet"
            description="When someone expresses interest, they'll show up here."
          />
        ) : (
          <div className="space-y-3">
            {received.map((i) => {
              const u = i.fromUser;
              const label =
                u.familyProfile?.familyName ||
                u.aupairProfile?.headline ||
                u.name;
              const profileHref =
                u.role === "AUPAIR" && u.aupairProfile
                  ? `/browse/aupairs/${u.aupairProfile.id}`
                  : u.role === "PARENT" && u.familyProfile
                    ? `/browse/families/${u.familyProfile.id}`
                    : "#";
              return (
                <Card key={i.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={u.name} image={u.image} size="md" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={profileHref} className="font-semibold text-stone-900 hover:text-teal-700">
                          {u.name}
                        </Link>
                        <StatusBadge status={i.status} />
                      </div>
                      <p className="text-sm text-stone-500">{label}</p>
                      {i.message && (
                        <p className="mt-2 text-sm text-stone-600">&ldquo;{i.message}&rdquo;</p>
                      )}
                      <p className="mt-1 text-xs text-stone-400">
                        {formatDistanceToNow(i.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {i.status === "PENDING" && (
                    <InterestActions interestId={i.id} mode="receive" />
                  )}
                  {i.status === "ACCEPTED" && (
                    <Link href="/messages" className="btn-secondary text-sm">
                      Messages
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Sent</h2>
        {sent.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title="You haven't sent interest yet"
            description="Browse profiles and use Express interest to apply."
            action={
              <Link
                href={user.role === "AUPAIR" ? "/browse/families" : "/browse/aupairs"}
                className="btn-primary"
              >
                Browse matches
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {sent.map((i) => {
              const u = i.toUser;
              const profileHref =
                u.role === "AUPAIR" && u.aupairProfile
                  ? `/browse/aupairs/${u.aupairProfile.id}`
                  : u.role === "PARENT" && u.familyProfile
                    ? `/browse/families/${u.familyProfile.id}`
                    : "#";
              return (
                <Card key={i.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={u.name} image={u.image} size="md" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={profileHref} className="font-semibold hover:text-teal-700">
                          {u.familyProfile?.familyName || u.name}
                        </Link>
                        <StatusBadge status={i.status} />
                      </div>
                      {i.message && (
                        <p className="mt-1 text-sm text-stone-500 line-clamp-2">{i.message}</p>
                      )}
                      <p className="mt-1 text-xs text-stone-400">
                        {formatDistanceToNow(i.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {i.status === "PENDING" && (
                    <InterestActions interestId={i.id} mode="sent" />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACCEPTED") return <Badge variant="success">Accepted</Badge>;
  if (status === "DECLINED") return <Badge variant="accent">Declined</Badge>;
  if (status === "WITHDRAWN") return <Badge>Withdrawn</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}
