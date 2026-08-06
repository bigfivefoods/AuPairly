// Prisma config — Supabase-friendly (pooled URL + direct URL for migrations)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // App runtime + migrate deploy: prefer DIRECT_URL for migrations when set
    // (Supabase pooler on 6543 does not support all migration operations)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
