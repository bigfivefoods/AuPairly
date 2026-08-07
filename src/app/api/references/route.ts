import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeSafetyScore } from "@/lib/safety";
import { getSiteUrl } from "@/lib/paystack";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aboutMe = await prisma.referenceRequest.findMany({
    where: { subjectId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const requested = await prisma.referenceRequest.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ aboutMe, requested });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const refereeEmail = String(body.refereeEmail || "").trim().toLowerCase();
  const refereeName = body.refereeName ? String(body.refereeName) : null;
  if (!refereeEmail.includes("@")) {
    return NextResponse.json({ error: "Valid refereeEmail required" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const ref = await prisma.referenceRequest.create({
    data: {
      requesterId: session.user.id,
      subjectId: session.user.id,
      refereeEmail,
      refereeName,
      token,
    },
  });

  const link = `${getSiteUrl()}/references/submit/${token}`;

  // Best-effort email to referee
  let emailed = false;
  try {
    const { sendEmail } = await import("@/lib/email");
    const subjectName = session.user.name || "An AuPairly member";
    const first = subjectName.split(" ")[0];
    const result = await sendEmail({
      to: refereeEmail,
      subject: `${first} asked for a short reference on AuPairly`,
      text: `Hi${refereeName ? ` ${refereeName}` : ""},

${subjectName} asked you to leave a short professional reference on AuPairly (trusted care for family, loved ones, home & pets).

It takes about 2 minutes — no account needed:
${link}

Thank you,
The AuPairly team
`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c1917">
        <p style="font-size:18px;font-weight:700">Au<span style="color:#0d9488">Pair</span>ly</p>
        <p style="line-height:1.6;color:#44403c">Hi${refereeName ? ` ${refereeName}` : ""},</p>
        <p style="line-height:1.6;color:#44403c"><strong>${subjectName}</strong> asked you to leave a short professional reference. No account needed — about 2 minutes.</p>
        <p style="margin-top:20px"><a href="${link}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Leave a reference</a></p>
        <p style="margin-top:16px;font-size:12px;color:#78716c">If the button doesn’t work, paste this link:<br/>${link}</p>
      </div>`,
    });
    emailed = Boolean(result.delivered);
  } catch (e) {
    console.error("[references] email referee", e);
  }

  return NextResponse.json({
    reference: ref,
    submitUrl: link,
    emailed,
    message: emailed
      ? "Invite emailed to your referee. You can also share the link."
      : "Share this link with your referee (email sent when Resend is configured).",
  });
}

/** Admin/system: recompute placement verified after refs */
export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const score = await recomputeSafetyScore(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { placementVerified: true, safetyScore: true, videoIntroUrl: true },
  });
  return NextResponse.json({ score, ...user });
}
