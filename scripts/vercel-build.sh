#!/usr/bin/env bash
# Vercel build: generate client → migrate → next build
set -euo pipefail

echo "==> Prisma generate"
npx prisma generate

# Supabase only: Session/Direct :5432 for migrations (never Vercel Postgres / Neon aliases)
MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo ""
  echo "❌ Supabase DATABASE_URL / DIRECT_URL is not set on this Vercel project."
  echo ""
  echo "This app uses Supabase Postgres only (no SQLite, Neon, or Vercel Postgres)."
  echo ""
  echo "Fix:"
  echo "  1. Supabase → Project Settings → Database → Connection string → URI"
  echo "       • Transaction pooler (6543, ?pgbouncer=true)  →  DATABASE_URL"
  echo "       • Session or Direct (5432)                     →  DIRECT_URL"
  echo "  2. Vercel → Project → Settings → Environment Variables"
  echo "     Add DATABASE_URL and DIRECT_URL for Production AND Preview (Build + Runtime)"
  echo "  3. Redeploy"
  echo "  See SUPABASE.md"
  echo ""
  exit 1
fi

# DIRECT_URL preferred for migrate; fall back to DATABASE_URL if only one is set
export DIRECT_URL="${DIRECT_URL:-$MIGRATE_URL}"
export DATABASE_URL="${DATABASE_URL:-$MIGRATE_URL}"

echo "==> Prisma migrate deploy"
npx prisma migrate deploy

echo "==> Next.js build"
npx next build
