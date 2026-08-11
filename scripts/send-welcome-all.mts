/**
 * One-off: send welcome email to all non-suspended users.
 * Usage: node --import tsx scripts/send-welcome-all.mts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { sendWelcomeEmail } from "../src/lib/email";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DELAY_MS = 400; // stay under Resend rate limits

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const users = await prisma.user.findMany({
    where: { suspendedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const targets = users.filter((u) => u.email?.includes("@"));
  console.log(`Found ${targets.length} users (non-suspended with email)`);

  let ok = 0;
  let fail = 0;
  const failures: { email: string; error: string }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const u = targets[i]!;
    const role =
      u.role === "AUPAIR" || u.role === "PARENT" || u.role === "ADMIN"
        ? u.role
        : "PARENT";
    process.stdout.write(`[${i + 1}/${targets.length}] ${u.email} … `);
    try {
      const result = await sendWelcomeEmail({
        email: u.email,
        name: u.name || "there",
        role,
      });
      if (result.delivered) {
        ok++;
        console.log("sent");
      } else {
        fail++;
        const err =
          "error" in result && result.error
            ? String(result.error)
            : `provider=${result.provider}`;
        failures.push({ email: u.email, error: err });
        console.log("FAILED", err.slice(0, 120));
      }
    } catch (e) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      failures.push({ email: u.email, error: msg });
      console.log("ERROR", msg.slice(0, 120));
    }
    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  console.log("\n=== Done ===");
  console.log(`sent: ${ok}  failed: ${fail}  total: ${targets.length}`);
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  ${f.email}: ${f.error.slice(0, 200)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
