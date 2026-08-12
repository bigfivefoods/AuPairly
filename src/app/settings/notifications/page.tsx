import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { PushSettingsCard } from "@/components/pwa-provider";
import { NotificationPrefsForm } from "@/components/notification-prefs-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notification settings" };

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      emailPrefMessages: true,
      whatsappAlerts: true,
      phone: true,
    },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <PageHeader
        eyebrow="App"
        title="Notifications & install"
        description="Choose email frequency, optional WhatsApp-style alerts via your phone, and web push. Install AuPairly to your home screen."
      />
      <NotificationPrefsForm
        initial={{
          emailPrefMessages: me?.emailPrefMessages || "INSTANT",
          whatsappAlerts: Boolean(me?.whatsappAlerts),
          phone: me?.phone || "",
        }}
      />
      <div className="mt-6">
        <PushSettingsCard />
      </div>
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
