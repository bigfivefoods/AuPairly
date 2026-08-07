/**
 * When a city gets an ACTIVE listing, email waitlist signups for that city.
 * Rows are removed after notify so people aren't spammed.
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { BRAND } from "@/lib/brand";

const site = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "https://www.aupairly.me"
  ).replace(/\/$/, "");

export async function notifyWaitlistForCity(opts: {
  city: string;
  rolePublished: "AUPAIR" | "PARENT";
}) {
  const city = opts.city?.trim();
  if (!city || city.length < 2) return { emailed: 0 };

  const rows = await prisma.cityWaitlist.findMany({
    where: {
      city: { equals: city, mode: "insensitive" },
    },
    take: 40,
    orderBy: { createdAt: "asc" },
  });
  if (!rows.length) return { emailed: 0 };

  const base = site();
  const browse =
    opts.rolePublished === "AUPAIR"
      ? `${base}/browse/aupairs`
      : `${base}/browse/families`;
  const who =
    opts.rolePublished === "AUPAIR" ? "sitters / caregivers" : "host families";

  let emailed = 0;
  for (const row of rows) {
    // Role filter: skip if waitlist is only for the opposite side
    if (
      row.role === "PARENT" &&
      opts.rolePublished === "PARENT"
    ) {
      // family waitlist wants sitters, not more families
      continue;
    }
    if (row.role === "AUPAIR" && opts.rolePublished === "AUPAIR") {
      continue;
    }

    const text = `Good news!

People are joining AuPairly in ${city}.

New ${who} are listing now. Browse matches:
${browse}

Create or finish your free profile:
${base}/register

— ${BRAND.name}
`;
    try {
      await sendEmail({
        to: row.email,
        subject: `${city} is live on AuPairly — come take a look`,
        text,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c1917">
          <p style="font-size:18px;font-weight:700">Au<span style="color:#0d9488">Pair</span>ly</p>
          <h1 style="font-size:18px">Good news for ${escape(city)}</h1>
          <p style="line-height:1.6;color:#44403c">New <strong>${escape(who)}</strong> are listing near you.</p>
          <p style="margin-top:20px"><a href="${browse}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Browse ${escape(city)}</a></p>
          <p style="margin-top:16px;font-size:13px;color:#78716c"><a href="${base}/register" style="color:#0d9488">Finish your free profile →</a></p>
        </div>`,
      });
      emailed++;
      await prisma.cityWaitlist.delete({ where: { id: row.id } }).catch(() => null);
    } catch (e) {
      console.error("[waitlist-notify]", e);
    }
  }

  return { emailed };
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
