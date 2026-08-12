import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { QuickSitterWizard } from "@/components/quick-sitter-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quick sitter listing" };

export default async function SitterStartPage() {
  const user = await requireUser();
  if (user.role !== "AUPAIR") {
    redirect("/host-job");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Sitters"
        title="Go live in minutes"
        description="City, headline, bio, and one service — enough to appear in browse. Add photo & video after for more messages."
      />
      <QuickSitterWizard />
      <Card className="mt-6 text-sm text-stone-500">
        Prefer the full form?{" "}
        <Link
          href="/profile/edit"
          className="font-semibold text-teal-700 hover:underline"
        >
          Profile & listing
        </Link>
        . Founding sitters in thin cities get a free featured boost when you
        publish.
      </Card>
    </div>
  );
}
