import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get started" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role !== "AUPAIR" && user.role !== "PARENT") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <OnboardingWizard role={user.role} name={user.name} />
    </div>
  );
}
