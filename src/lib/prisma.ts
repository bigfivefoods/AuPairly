import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Lazy Prisma client for Supabase Postgres only.
 * Next.js build workers won't crash on import; runtime still needs env set.
 *
 * Required on Vercel / local:
 * - DATABASE_URL — Supabase Transaction pooler (:6543, ?pgbouncer=true)
 * - DIRECT_URL — Supabase Session/Direct (:5432) for migrations
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string | undefined {
  // Supabase only — no Vercel Postgres / Neon / other aliases
  return process.env.DATABASE_URL || process.env.DIRECT_URL;
}

function createPrismaClient(): PrismaClient {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase pooler URI (Transaction :6543) as DATABASE_URL and Session/Direct (:5432) as DIRECT_URL. See SUPABASE.md and .env.example."
    );
  }
  if (!isLikelySupabaseUrl(connectionString)) {
    console.warn(
      "[prisma] DATABASE_URL does not look like a Supabase host (*.supabase.com / pooler.supabase.com). This project is configured for Supabase only."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function isLikelySupabaseUrl(url: string): boolean {
  return (
    url.includes("supabase.com") ||
    url.includes("pooler.supabase.com") ||
    url.includes("supabase.co")
  );
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  // After `prisma generate` adds models (e.g. ProfileServiceTag), a hot-reloaded
  // Next.js process can keep an old client on globalThis without those getters.
  // Recreate when a known marketplace model is missing.
  const client = globalForPrisma.prisma as PrismaClient & {
    profileServiceTag?: unknown;
    serviceCategory?: unknown;
  };
  if (
    client.profileServiceTag === undefined ||
    client.serviceCategory === undefined
  ) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

/**
 * Proxy defers client creation until first property access (query),
 * so importing this module during `next build` does not throw.
 *
 * Important: model accessors are getters on the PrismaClient prototype.
 * Always read them with `this` = the real client (never the Proxy target).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    // Bracket access / Reflect with client as receiver — not the empty Proxy target
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
