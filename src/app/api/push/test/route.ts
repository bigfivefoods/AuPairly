import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPushConfigured, sendPushToUser } from "@/lib/push";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        error:
          "Push not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (see .env.example).",
      },
      { status: 503 }
    );
  }

  // createNotification already triggers web push
  await createNotification({
    userId: session.user.id,
    type: "SYSTEM",
    title: "AuPairly push works 🎉",
    body: "You'll get alerts for messages, matches, and interests on this device.",
    href: "/dashboard",
    push: true,
  });

  // Confirm devices are stored (send is async from createNotification)
  const result = await sendPushToUser(session.user.id, {
    title: "Test ping",
    body: "If you see this, push delivery is healthy.",
    href: "/settings/notifications",
    tag: "test",
  });

  return NextResponse.json({ ok: true, ...result });
}
