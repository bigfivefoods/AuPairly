// Prisma config — Supabase Postgres only
// DIRECT_URL (Session/Direct :5432) for migrations; DATABASE_URL (Transaction :6543) at runtime.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Non-empty placeholder so config loads; scripts/vercel-build.sh validates real URLs first
    url: url ?? "postgresql://missing:missing@localhost:5432/missing",
  },
});
