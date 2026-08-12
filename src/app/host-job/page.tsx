import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { HostJobWizard } from "@/components/host-job-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post a job (quick)" };

export default async function HostJobPage() {
  const user = await requireUser();
  if (user.role !== "PARENT") {
    redirect("/profile/edit");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Hosts"
        title="Post a job in minutes"
        description="City, job, dates, and pay — go live free. Thin cities get a founding host featured boost automatically."
      />
      <HostJobWizard />
      <Card className="mt-6 text-sm text-stone-500">
        After you publish: message 3 sitters, then{" "}
        <Link href="/invite" className="font-semibold text-teal-700 hover:underline">
          invite locals
        </Link>
        . House swap? Enable it on{" "}
        <Link href="/profile/edit" className="font-semibold text-teal-700 hover:underline">
          your listing
        </Link>
        .
      </Card>
    </div>
  );
}
