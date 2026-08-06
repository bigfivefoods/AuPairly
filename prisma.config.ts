// Prisma config — Supabase-friendly
// Prefer DIRECT_URL for migrations (port 5432). App runtime uses DATABASE_URL (pooler).
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Must be a non-empty string when migrate runs; scripts/vercel-build.sh validates first
    url: url ?? "postgresql://missing:missing@localhost:5432/missing",
  },
});
