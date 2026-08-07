/**
 * Email delivery: Resend when RESEND_API_KEY is set, else console (dev).
 */

import { BRAND } from "@/lib/brand";

const site = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "https://www.aupairly.me";

const TEAL = "#0d9488";
const TEAL_DARK = "#0f766e";
const STONE = "#44403c";
const STONE_MUTED = "#78716c";
const CREAM = "#faf8f5";
const GOLD = "#c4a35a";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@aupairly.me";

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

/**
 * Logo for HTML emails.
 * Always use a production absolute HTTPS URL (never env/site() / localhost) —
 * recipients cannot load images from the machine that sent the mail.
 * Prefer solid-background PNG (transparent logos often vanish in dark mode).
 * `logo.png` is live on Vercel; `email-logo.png` is a smaller optimized copy.
 */
function emailLogoUrl() {
  const fromEnv = process.env.EMAIL_LOGO_URL?.trim();
  if (fromEnv?.startsWith("https://")) return fromEnv;
  // Optimized asset (deploy with public/email-logo.png); same host always
  return "https://www.aupairly.me/logo.png";
}

function brandHeader() {
  const logo = emailLogoUrl();
  const home = "https://www.aupairly.me";
  // Table + fixed pixel width = reliable in Gmail / Outlook / Apple Mail
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 auto">
    <tr>
      <td align="center" style="padding:4px 0 0;text-align:center">
        <a href="${home}" style="text-decoration:none;border:0;display:inline-block" target="_blank">
          <img
            src="${logo}"
            alt="AuPairly"
            width="220"
            height="110"
            border="0"
            style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;margin:0 auto;background-color:#faf8f5"
          />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:10px 8px 0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.4;color:${STONE_MUTED};letter-spacing:0.02em">
        ${escapeHtml(BRAND.taglineShort)}
      </td>
    </tr>
  </table>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${TEAL};color:#ffffff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(13,148,136,0.25)">${label}</a>`;
}

function wrapHtml(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;font-family:Georgia,'Times New Roman',serif;background:${CREAM};padding:24px 12px;color:#1c1917">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e7e5e4;box-shadow:0 4px 24px rgba(28,25,23,0.06)">
    <div style="height:4px;background:linear-gradient(90deg,${GOLD},${TEAL},${TEAL_DARK})"></div>
    <div style="padding:28px 28px 8px">${brandHeader()}</div>
    <div style="padding:8px 28px 32px">
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:16px 0 12px;color:#1c1917;line-height:1.3">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:32px;padding-top:20px;border-top:1px solid #f5f5f4;font-size:12px;color:${STONE_MUTED};line-height:1.5;font-family:system-ui,sans-serif">
        You're receiving this because you have an AuPairly account.<br/>
        <a href="${site()}" style="color:${TEAL}">${BRAND.domain}</a>
        · <a href="mailto:${BRAND.email}" style="color:${TEAL}">${BRAND.email}</a>
      </p>
    </div>
  </div>
</body></html>`;
}

/** Shared FAQ block for welcome + related onboarding emails */
function welcomeFaqHtml(base: string) {
  const faqs: { q: string; a: string }[] = [
    {
      q: "Is AuPairly free to join?",
      a: "Yes. You can create a profile, browse, and start matching on the free plan. Plus unlocks unlimited messages and Discover when you're ready — from R99 for 2 weeks.",
    },
    {
      q: "What can I use AuPairly for?",
      a: "Childcare & au pairs, caregiving for loved ones, house sitting, and pet sitting — one account for family, home, and pets.",
    },
    {
      q: "How does verification work?",
      a: "After signup you can complete ID + selfie verification. Verified members get a trust badge that hosts and sitters look for before messaging.",
    },
    {
      q: "How do I find a match?",
      a: "Set your city and services, then Browse listings or use Discover. Send an interest or message — serious matches can move into placements.",
    },
    {
      q: "Is messaging safe?",
      a: "Keep chats in-app until you're comfortable. Never share banking details or move money outside agreed arrangements. Report anything suspicious from a profile.",
    },
    {
      q: "Need help?",
      a: `We're here for you — email <a href="mailto:${BRAND.email}" style="color:${TEAL}">${BRAND.email}</a> or WhatsApp <a href="${BRAND.whatsappHref}" style="color:${TEAL}">${BRAND.whatsapp}</a>. Guides live at <a href="${base}/how-it-works" style="color:${TEAL}">How it works</a> and <a href="${base}/safety" style="color:${TEAL}">Safety</a>.`,
    },
  ];

  const items = faqs
    .map(
      (f) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f5f5f4">
        <p style="margin:0 0 6px;font-family:system-ui,sans-serif;font-size:14px;font-weight:700;color:#1c1917">${escapeHtml(f.q)}</p>
        <p style="margin:0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.55;color:${STONE}">${f.a}</p>
      </td>
    </tr>`
    )
    .join("");

  return `
  <div style="margin-top:28px;background:${CREAM};border-radius:16px;padding:20px 18px;border:1px solid #f0ebe3">
    <p style="margin:0 0 4px;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${TEAL_DARK}">FAQ</p>
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1c1917">Common questions</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>
  </div>`;
}

function welcomeFaqText(base: string) {
  return `
FAQ
───
Is AuPairly free to join?
Yes. Free to join and start matching. Plus (from R99 / 2 weeks) unlocks unlimited messages & Discover.

What can I use AuPairly for?
Childcare & au pairs, caregiving, house sitting, and pet sitting.

How does verification work?
Complete ID + selfie verification for a Verified trust badge.

How do I find a match?
Set city & services → Browse or Discover → send interests/messages.

Is messaging safe?
Stay in-app until you're comfortable. Never share banking details. Report anything suspicious.

Need help?
Email ${BRAND.email} · WhatsApp ${BRAND.whatsapp}
How it works: ${base}/how-it-works
Safety: ${base}/safety
`;
}

export async function sendWelcomeEmail(user: {
  email: string;
  name: string;
  role: string;
}) {
  const first = (user.name || "there").split(" ")[0] || "there";
  const base = site().replace(/\/$/, "");
  const isSitter = user.role === "AUPAIR";
  const isHost = user.role === "PARENT";
  const roleLabel = isSitter
    ? "sitter"
    : isHost
      ? "host"
      : "member";
  const rolePhrase = isSitter
    ? "You're set up as a <strong>sitter</strong> — ready to offer childcare, caregiving, house sitting, or pet care."
    : isHost
      ? "You're set up as a <strong>host</strong> — ready to find trusted help for your family, home, or pets."
      : "Your AuPairly account is ready.";

  const onboard = `${base}/onboarding`;
  const howItWorks = `${base}/how-it-works`;
  const pricing = `${base}/pricing`;
  const safety = `${base}/safety`;
  const browse =
    isSitter ? `${base}/browse/families` : `${base}/browse/aupairs`;
  const browseLabel = isSitter ? "Browse hosts" : "Browse sitters";

  const steps = isSitter
    ? [
        "Pick the services you offer (childcare, caregiving, house or pet sitting)",
        "Add your city and a clear profile photo",
        "Write a short, warm bio — families love personality",
        "Get verified for the trust badge, then publish",
      ]
    : isHost
      ? [
          "Pick the care you need (childcare, caregiving, house or pet sitting)",
          "Set your city and add a welcoming family or home photo",
          "Describe your household and what a great match looks like",
          "Get verified, publish your listing, and start Discover",
        ]
      : [
          "Choose services and your city",
          "Add a photo and bio",
          "Get verified",
          "Publish and start matching",
        ];

  const stepsHtml = steps
    .map(
      (s, i) =>
        `<tr>
          <td style="vertical-align:top;padding:6px 10px 6px 0;width:28px">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:999px;background:${TEAL};color:#fff;font-family:system-ui,sans-serif;font-size:12px;font-weight:700">${i + 1}</span>
          </td>
          <td style="padding:6px 0;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:${STONE}">${escapeHtml(s)}</td>
        </tr>`
    )
    .join("");

  const text = `Hi ${first},

Welcome to AuPairly — we're so glad you're here.

${rolePhrase.replace(/<[^>]+>/g, "")}

${BRAND.tagline}

Your first steps (about 2 minutes):
${steps.map((s, i) => `${i + 1}) ${s}`).join("\n")}

Finish setup: ${onboard}
${browseLabel}: ${browse}
How it works: ${howItWorks}
Pricing: ${pricing}
Safety: ${safety}

${welcomeFaqText(base)}

With warmth,
The AuPairly team
${BRAND.domain}
${BRAND.email}
`;

  const html = wrapHtml(
    `Welcome to AuPairly, ${escapeHtml(first)} 💛`,
    `
    <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.65;color:${STONE};margin:0 0 14px">
      We're so glad you're here. Whether you're looking for care or offering it, AuPairly is built to help you find <strong>trusted people nearby</strong> — with warmth, clarity, and safety at the centre.
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.65;color:${STONE};margin:0 0 18px">
      ${rolePhrase}
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.5;color:${STONE_MUTED};margin:0 0 20px;font-style:italic">
      ${escapeHtml(BRAND.tagline)}
    </p>

    <div style="background:linear-gradient(135deg,#f0fdfa 0%,${CREAM} 100%);border:1px solid #ccfbf1;border-radius:16px;padding:18px 16px;margin:0 0 22px">
      <p style="margin:0 0 10px;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${TEAL_DARK}">Your first steps</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${stepsHtml}</table>
    </div>

    <p style="text-align:center;margin:8px 0 8px">
      ${ctaButton(onboard, "Finish setup — under 2 min")}
    </p>
    <p style="text-align:center;margin:12px 0 0;font-family:system-ui,sans-serif;font-size:13px">
      <a href="${browse}" style="color:${TEAL};font-weight:600;text-decoration:none">${browseLabel} →</a>
      <span style="color:#d6d3d1;margin:0 8px">·</span>
      <a href="${howItWorks}" style="color:${TEAL};font-weight:600;text-decoration:none">How it works</a>
      <span style="color:#d6d3d1;margin:0 8px">·</span>
      <a href="${pricing}" style="color:${TEAL};font-weight:600;text-decoration:none">Pricing</a>
    </p>

    ${welcomeFaqHtml(base)}

    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:${STONE};margin:28px 0 0">
      We're rooting for a great first match.<br/>
      <strong style="color:#1c1917">With warmth,</strong><br/>
      The AuPairly team
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:12px;color:${STONE_MUTED};margin:16px 0 0">
      <a href="${BRAND.social.instagram}" style="color:${TEAL};text-decoration:none">Instagram</a>
      · <a href="${BRAND.social.tiktok}" style="color:${TEAL};text-decoration:none">TikTok</a>
      · <a href="${BRAND.social.facebook}" style="color:${TEAL};text-decoration:none">Facebook</a>
      · <a href="${safety}" style="color:${TEAL};text-decoration:none">Safety tips</a>
    </p>
    `
  );

  return sendEmail({
    to: user.email,
    subject: `Welcome to AuPairly, ${first} — let's get you set up 💛`,
    text,
    html,
  });
}

/** Receipt after successful Paystack membership payment */
export async function sendPaymentReceiptEmail(opts: {
  toEmail: string;
  toName: string;
  planName: string;
  periodLabel: string;
  days: number;
  amountCents: number;
  currency?: string;
  reference?: string | null;
}) {
  const first = (opts.toName || "there").split(" ")[0] || "there";
  const base = site().replace(/\/$/, "");
  const currency = (opts.currency || "ZAR").toUpperCase();
  const amountMajor = (Number(opts.amountCents) || 0) / 100;
  const amountStr =
    currency === "ZAR"
      ? `R${amountMajor.toFixed(amountMajor % 1 === 0 ? 0 : 2)}`
      : `${currency} ${amountMajor.toFixed(2)}`;
  const dash = `${base}/dashboard`;
  const discover = `${base}/discover`;
  const billing = `${base}/billing`;
  const ref = opts.reference ? String(opts.reference) : "";

  const text = `Hi ${first},

Payment received — thank you!

Plan: ${opts.planName} (${opts.periodLabel})
Amount: ${amountStr}
Access: ${opts.days} days
${ref ? `Reference: ${ref}\n` : ""}
Your membership is active. Unlimited matching is unlocked.

Dashboard: ${dash}
Discover: ${discover}
Billing: ${billing}

— AuPairly
`;

  const html = wrapHtml(
    `Payment confirmed 💛`,
    `
    <p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.65;color:${STONE};margin:0 0 14px">
      Hi ${escapeHtml(first)}, thanks for supporting AuPairly. Your membership is <strong>active</strong>.
    </p>
    <div style="background:${CREAM};border:1px solid #f0ebe3;border-radius:14px;padding:16px;margin:0 0 20px;font-family:system-ui,sans-serif;font-size:14px;color:${STONE}">
      <p style="margin:0 0 8px"><strong>Plan:</strong> ${escapeHtml(opts.planName)} · ${escapeHtml(opts.periodLabel)}</p>
      <p style="margin:0 0 8px"><strong>Paid:</strong> ${escapeHtml(amountStr)}</p>
      <p style="margin:0 0 8px"><strong>Access:</strong> ${opts.days} days</p>
      ${ref ? `<p style="margin:0;font-size:12px;color:${STONE_MUTED}"><strong>Ref:</strong> ${escapeHtml(ref)}</p>` : ""}
    </div>
    <p style="text-align:center;margin:8px 0">
      ${ctaButton(discover, "Open Discover")}
    </p>
    <p style="text-align:center;margin:12px 0 0;font-family:system-ui,sans-serif;font-size:13px">
      <a href="${dash}" style="color:${TEAL};font-weight:600;text-decoration:none">Dashboard</a>
      <span style="color:#d6d3d1;margin:0 8px">·</span>
      <a href="${billing}" style="color:${TEAL};font-weight:600;text-decoration:none">Billing</a>
    </p>
    `
  );

  return sendEmail({
    to: opts.toEmail,
    subject: `Receipt: ${opts.planName} · ${amountStr} — AuPairly`,
    text,
    html,
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

/** Daily saved-search digest email */
export async function sendSavedSearchAlertEmail(opts: {
  toEmail: string;
  toName: string;
  searchName: string;
  count: number;
  targetLabel: string;
  href: string;
}) {
  const first = opts.toName.split(" ")[0] || "there";
  const text = `Hi ${first},\n\n${opts.count} new ${opts.targetLabel} listing(s) match your saved search “${opts.searchName}” on AuPairly.\n\nView matches:\n${opts.href}\n\n— AuPairly`;
  return sendEmail({
    to: opts.toEmail,
    subject: `${opts.count} new match${opts.count === 1 ? "" : "es"} for “${opts.searchName}”`,
    text,
    html: wrapHtml(
      `New matches for “${escapeHtml(opts.searchName)}”`,
      `<p style="line-height:1.6;color:#44403c">Hi ${escapeHtml(first)},</p>
       <p style="line-height:1.6;color:#44403c"><strong>${opts.count}</strong> new ${escapeHtml(opts.targetLabel)} listing(s) match your saved search.</p>
       <p style="margin-top:20px"><a href="${opts.href}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">View matches</a></p>
       <p style="margin-top:16px;font-size:12px;color:#78716c">Manage alerts in Saved searches on AuPairly.</p>`
    ),
  });
}

/** Day-1 activation — photo, city, publish, nearby people */
export async function sendDay1ActivationEmail(opts: {
  toEmail: string;
  toName: string;
  role: string;
  city?: string | null;
  nearbyCount?: number;
}) {
  const first = opts.toName.split(" ")[0] || "there";
  const cityBit = opts.city ? ` near ${opts.city}` : "";
  const nearby =
    opts.nearbyCount && opts.nearbyCount > 0
      ? `${opts.nearbyCount} people${cityBit} are already on AuPairly.`
      : `Publish your listing so people${cityBit || " nearby"} can find you.`;
  const dash = `${site()}/dashboard`;
  const discover = `${site()}/discover`;
  const text = `Hi ${first},\n\nDay 1 on AuPairly — make it count.\n\n1) Photo + city + publish (if you haven’t)\n2) Send 3 interests or messages\n3) Get verified for the trust badge\n\n${nearby}\n\nDashboard: ${dash}\nDiscover: ${discover}\n\n— AuPairly`;
  return sendEmail({
    to: opts.toEmail,
    subject: `Your Day 1 checklist${opts.city ? ` · ${opts.city}` : ""}`,
    text,
    html: wrapHtml(
      `Day 1 checklist, ${escapeHtml(first)}`,
      `<p style="line-height:1.6;color:#44403c">${escapeHtml(nearby)}</p>
       <ol style="line-height:1.7;color:#44403c;padding-left:18px">
         <li>Photo → city → publish listing</li>
         <li>Send 3 interests or messages</li>
         <li>Get verified for the trust badge</li>
       </ol>
       <p style="margin-top:20px"><a href="${dash}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open dashboard</a>
       <a href="${discover}" style="display:inline-block;margin-left:8px;color:#0d9488;font-weight:600">Discover →</a></p>`
    ),
  });
}

/** Soft nudge when free message limit is hit (optional outbound) */
export async function sendUpgradeNudgeEmail(opts: {
  toEmail: string;
  toName: string;
  used: number;
  limit: number;
}) {
  const first = opts.toName.split(" ")[0] || "there";
  const href = `${site()}/pricing`;
  const text = `Hi ${first},\n\nYou've used ${opts.used}/${opts.limit} free messages today on AuPairly.\n\nUnlock unlimited matching from R99 / 2 weeks:\n${href}\n\n— AuPairly`;
  return sendEmail({
    to: opts.toEmail,
    subject: "Unlock unlimited messages — from R99",
    text,
    html: wrapHtml(
      `Keep the conversation going`,
      `<p style="line-height:1.6;color:#44403c">You've used <strong>${opts.used}/${opts.limit}</strong> free messages today.</p>
       <p style="margin-top:20px"><a href="${href}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">See Plus from R99</a></p>`
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
