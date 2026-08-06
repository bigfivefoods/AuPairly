/**
 * Email delivery: Resend when RESEND_API_KEY is set, else console (dev).
 */

const site = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";

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
      // Don't crash product flows on email failure
      return { delivered: false as const, provider: "resend" as const, error: body };
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

function wrapHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#faf8f5;padding:24px;color:#1c1917">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e7e5e4">
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;color:#1c1917">Au<span style="color:#0d9488">Pair</span>ly</div>
    <h1 style="font-size:18px;margin:16px 0 12px">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:28px;font-size:12px;color:#78716c">You're receiving this because you have an AuPairly account.</p>
  </div></body></html>`;
}

export async function sendWelcomeEmail(user: { email: string; name: string; role: string }) {
  const first = user.name.split(" ")[0];
  const roleLabel =
    user.role === "AUPAIR" ? "sitter / caregiver" : user.role === "PARENT" ? "host / family" : "member";
  const onboard = `${site()}/onboarding`;
  const text = `Hi ${first},\n\nWelcome to AuPairly! Your ${roleLabel} account is ready.\n\n1) Choose services (childcare, caregiving, house or pet sitting)\n2) Set your city\n3) Add a photo + bio\n4) Get verified\n\nStart here (under 2 minutes):\n${onboard}\n\n— The AuPairly team`;
  return sendEmail({
    to: user.email,
    subject: "Welcome to AuPairly — finish setup in 2 minutes",
    text,
    html: wrapHtml(
      `Welcome, ${first}!`,
      `<p style="line-height:1.6;color:#44403c">Your <strong>${roleLabel}</strong> account is ready. AuPairly covers <strong>childcare, caregiving, house sitting &amp; pet sitting</strong>.</p>
       <ol style="line-height:1.7;color:#44403c;padding-left:18px">
         <li>Pick the services you offer or need</li>
         <li>Set your city</li>
         <li>Add a photo &amp; bio</li>
         <li>Get verified for the trust badge</li>
       </ol>
       <p style="margin-top:20px"><a href="${onboard}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Finish setup</a></p>`
    ),
  });
}

/** Nudge incomplete profiles (callable from cron or admin later). */
export async function sendCompleteProfileEmail(user: {
  email: string;
  name: string;
  percent?: number;
}) {
  const first = user.name.split(" ")[0];
  const edit = `${site()}/profile/edit`;
  const pct = user.percent != null ? ` You're at ${user.percent}% complete.` : "";
  const text = `Hi ${first},\n\nProfiles with a photo and full bio get far more messages.${pct}\n\nFinish yours:\n${edit}\n\n— AuPairly`;
  return sendEmail({
    to: user.email,
    subject: "Unlock Discover — complete your AuPairly profile",
    text,
    html: wrapHtml(
      `You're almost match-ready`,
      `<p style="line-height:1.6;color:#44403c">Profiles with a clear photo and solid bio get more messages.${pct}</p>
       <p style="margin-top:20px"><a href="${edit}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Complete profile</a></p>`
    ),
  });
}

export async function sendNewMessageEmail(opts: {
  toEmail: string;
  toName: string;
  fromName: string;
  preview: string;
  conversationId: string;
}) {
  const href = `${site()}/messages/${opts.conversationId}`;
  const text = `Hi ${opts.toName.split(" ")[0]},\n\n${opts.fromName} sent you a message on AuPairly:\n\n"${opts.preview.slice(0, 200)}"\n\nReply: ${href}\n`;
  return sendEmail({
    to: opts.toEmail,
    subject: `New message from ${opts.fromName}`,
    text,
    html: wrapHtml(
      `Message from ${opts.fromName}`,
      `<p style="line-height:1.6;color:#44403c">You have a new message:</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:#f5f5f4;border-radius:12px;color:#292524">${escapeHtml(opts.preview.slice(0, 280))}</blockquote>
       <p><a href="${href}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open conversation</a></p>`
    ),
  });
}

export async function sendInterestEmail(opts: {
  toEmail: string;
  toName: string;
  fromName: string;
  message?: string | null;
  interestId: string;
}) {
  const href = `${site()}/interests`;
  const text = `Hi ${opts.toName.split(" ")[0]},\n\n${opts.fromName} expressed interest in matching with you on AuPairly.\n${opts.message ? `\nThey said: "${opts.message}"\n` : ""}\nReview: ${href}\n`;
  return sendEmail({
    to: opts.toEmail,
    subject: `${opts.fromName} is interested in matching`,
    text,
    html: wrapHtml(
      `${opts.fromName} is interested`,
      `<p style="line-height:1.6;color:#44403c"><strong>${escapeHtml(opts.fromName)}</strong> wants to explore a match with you.</p>
       ${opts.message ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#f5f5f4;border-radius:12px">${escapeHtml(opts.message)}</blockquote>` : ""}
       <p><a href="${href}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Review interest</a></p>`
    ),
  });
}

export async function sendInterestUpdateEmail(opts: {
  toEmail: string;
  toName: string;
  fromName: string;
  status: "ACCEPTED" | "DECLINED";
}) {
  const accepted = opts.status === "ACCEPTED";
  const href = accepted ? `${site()}/messages` : `${site()}/browse/aupairs`;
  const text = `Hi ${opts.toName.split(" ")[0]},\n\n${opts.fromName} ${accepted ? "accepted" : "declined"} your interest on AuPairly.\n\n${href}\n`;
  return sendEmail({
    to: opts.toEmail,
    subject: accepted
      ? `${opts.fromName} accepted your interest 🎉`
      : `Update on your interest with ${opts.fromName}`,
    text,
    html: wrapHtml(
      accepted ? "Interest accepted" : "Interest update",
      `<p style="line-height:1.6;color:#44403c"><strong>${escapeHtml(opts.fromName)}</strong> ${accepted ? "accepted your interest — you can message them now." : "declined this interest."}</p>
       <p><a href="${href}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${accepted ? "Open messages" : "Keep browsing"}</a></p>`
    ),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
