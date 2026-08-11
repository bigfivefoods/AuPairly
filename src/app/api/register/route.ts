import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import {
  isPrivyConfigured,
  verifyPrivyEmailAccess,
} from "@/lib/privy";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["AUPAIR", "PARENT"]),
  /** Privy access token after successful email OTP */
  privyAccessToken: z.string().min(10).optional(),
  /** Invite code from /register?ref= (prefix of inviter user id) */
  refCode: z.string().min(4).max(32).optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, { limit: 8, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many signups from this network. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    // Require Privy email verification in production (when configured)
    const privyRequired =
      isPrivyConfigured() && process.env.PRIVY_EMAIL_VERIFY_REQUIRED !== "false";

    let privyUserId: string | null = null;

    if (privyRequired) {
      if (!data.privyAccessToken) {
        return NextResponse.json(
          {
            error:
              "Please verify your email with the one-time code before creating an account.",
          },
          { status: 400 }
        );
      }
      try {
        const verified = await verifyPrivyEmailAccess({
          accessToken: data.privyAccessToken,
          email,
        });
        privyUserId = verified.privyUserId;
      } catch (e) {
        console.error("[register] privy verify failed", e);
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Email verification failed. Request a new code and try again.",
          },
          { status: 401 }
        );
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    let referredById: string | null = null;
    if (data.refCode) {
      const code = data.refCode.trim();
      const inviter = await prisma.user.findFirst({
        where: {
          OR: [{ id: code }, { id: { startsWith: code } }],
        },
        select: { id: true, name: true },
      });
      if (inviter) referredById = inviter.id;
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        role: data.role,
        emailVerified: privyUserId ? new Date() : null,
        ...(referredById ? { referredById } : {}),
        ...(data.role === "AUPAIR"
          ? {
              aupairProfile: {
                create: {
                  headline: `${data.name.split(" ")[0]} — trusted care`,
                  status: "DRAFT",
                  services: '["CHILDCARE"]',
                },
              },
            }
          : {
              familyProfile: {
                create: {
                  familyName: `${data.name.split(" ")[0]} Family`,
                  headline: `Looking for trusted care`,
                  status: "DRAFT",
                  services: '["CHILDCARE"]',
                },
              },
            }),
      },
      select: { id: true, email: true, name: true, role: true, emailVerified: true },
    });

    await createNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to AuPairly",
      body: "Pick your services and city — takes under 2 minutes.",
      href: "/onboarding",
    });

    if (referredById) {
      await createNotification({
        userId: referredById,
        type: "SYSTEM",
        title: "Your invite worked!",
        body: `${user.name.split(" ")[0]} joined AuPairly with your link. More people nearby helps everyone match.`,
        href: "/dashboard",
      }).catch(() => null);

      try {
        const { grantReferralReward } = await import("@/lib/referral-reward");
        await grantReferralReward({
          inviterId: referredById,
          inviteeName: user.name,
          inviteeId: user.id,
        });
      } catch (e) {
        console.error("[register] referral reward", e);
      }
    }

    void sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch((e) => console.error("[email] welcome", e));

    // Instant owner alerts for every new signup
    try {
      const { getManagementEmails } = await import("@/lib/management");
      const { sendOwnerSignupAlertEmail } = await import("@/lib/email");
      for (const toEmail of getManagementEmails()) {
        void sendOwnerSignupAlertEmail({
          toEmail,
          memberName: user.name,
          memberEmail: user.email,
          role: user.role,
        }).catch((e) => console.error("[email] owner signup", e));
      }
    } catch (e) {
      console.error("[register] owner signup alerts", e);
    }

    return NextResponse.json(
      { user, emailVerified: Boolean(user.emailVerified), privyUserId },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
