/**
 * Email delivery abstraction.
 * Logs to console in development; plug in Resend/SendGrid via RESEND_API_KEY when ready.
 */

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "AuPairly <noreply@aupairly.me>";

  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html ?? opts.text.replace(/\n/g, "<br/>"),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend failed", body);
      throw new Error("Failed to send email");
    }
    return { delivered: true as const, provider: "resend" as const };
  }

  console.log("\n========== AuPairly email (dev) ==========");
  console.log(`To: ${opts.to}`);
  console.log(`Subject: ${opts.subject}`);
  console.log(opts.text);
  console.log("==========================================\n");
  return { delivered: false as const, provider: "console" as const };
}
