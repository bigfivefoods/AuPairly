import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { PushSettingsCard } from "@/components/pwa-provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notification settings" };

export default async function NotificationSettingsPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <PageHeader
        eyebrow="App"
        title="Notifications & install"
        description="Enable web push for messages and matches. Install AuPairly to your home screen for an app-like experience."
      />
      <PushSettingsCard />
      <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        <p className="font-semibold text-stone-900">Install tips</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Android Chrome:</strong> menu → Install app / Add to Home screen
          </li>
          <li>
            <strong>iPhone Safari:</strong> Share → Add to Home Screen
          </li>
          <li>
            <strong>Desktop:</strong> install icon in the address bar when offered
          </li>
        </ul>
      </div>
    </div>
  );
}
