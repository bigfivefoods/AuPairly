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
        description="Capture what the job entails, dates, live-in/out, pay, and visa support — then polish photos on your full listing."
      />
      <HostJobWizard />
      <Card className="mt-6 text-sm text-stone-500">
        Need house swap instead? Enable{" "}
        <Link href="/profile/edit" className="font-semibold text-teal-700 hover:underline">
          House swap
        </Link>{" "}
        on your listing, or open{" "}
        <Link href="/house-swap" className="font-semibold text-teal-700 hover:underline">
          /house-swap
        </Link>
        .
      </Card>
    </div>
  );
}
