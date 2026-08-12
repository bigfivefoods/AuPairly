/**
 * Fan-out management / owner email alerts to every allowlisted ops email
 * (Craig, Rylee Kendall, + MANAGEMENT_EMAILS env).
 */

import { getManagementEmails } from "@/lib/management";

export type ManagementAlert = {
  subject: string;
  title: string;
  body: string;
  href?: string;
  ctaLabel?: string;
};

/** Fire-and-forget: email every management recipient. Never throws. */
export async function notifyManagement(alert: ManagementAlert): Promise<void> {
  try {
    const recipients = getManagementEmails();
    if (!recipients.length) {
      console.warn("[notify-management] no recipients configured");
      return;
    }
    const { sendManagementAlertEmail } = await import("@/lib/email");
    await Promise.all(
      recipients.map((toEmail) =>
        sendManagementAlertEmail({
          toEmail,
          subject: alert.subject,
          title: alert.title,
          body: alert.body,
          href: alert.href,
          ctaLabel: alert.ctaLabel,
        }).catch((e) => {
          console.error("[notify-management] send failed", toEmail, e);
        })
      )
    );
  } catch (e) {
    console.error("[notify-management]", e);
  }
}
