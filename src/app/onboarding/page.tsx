import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get started" };

/**
 * Full-viewport onboarding (covers site chrome).
 * Desktop split rail + form; mobile stacked with sticky actions.
 */
export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role !== "AUPAIR" && user.role !== "PARENT") redirect("/dashboard");

  return (
    <OnboardingWizard
      role={user.role}
      name={user.name}
      initialImage={user.image}
    />
  );
}
