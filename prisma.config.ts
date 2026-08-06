// Prisma config — Supabase Postgres only
// DIRECT_URL (Session/Direct :5432) for migrations; DATABASE_URL (Transaction :6543) at runtime.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Never default to localhost — that silently breaks Vercel builds when env is missing.
// Use a clearly invalid host so P1001 is obvious; vercel-build.sh fails earlier with a guide.
const resolved =
  url && !url.includes("localhost") && !url.includes("127.0.0.1")
    ? url
    : url ||
      "postgresql://ENV_NOT_SET:ENV_NOT_SET@db.supabase.invalid:5432/postgres";

if (!url) {
  console.warn(
    "[prisma.config] DIRECT_URL / DATABASE_URL not set. Set Supabase URIs on Vercel (see SUPABASE.md)."
  );
} else if (url.includes("localhost") || url.includes("127.0.0.1")) {
  console.warn(
    "[prisma.config] DATABASE_URL points at localhost — this will fail on Vercel. Use Supabase pooler URIs."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolved,
  },
});
