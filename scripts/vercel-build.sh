#!/usr/bin/env bash
# Vercel build: generate client → migrate → next build
# Always use this script (vercel.json buildCommand) — never raw migrate on localhost.
set -euo pipefail

# Supabase only: Session/Direct :5432 for migrations
MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo ""
  echo "❌ Supabase DATABASE_URL / DIRECT_URL is not set on this Vercel project."
  echo ""
  echo "This app uses Supabase Postgres only."
  echo ""
  echo "Fix:"
  echo "  1. Supabase → Project Settings → Database → Connection string → URI"
  echo "       • Transaction pooler (6543, ?pgbouncer=true)  →  DATABASE_URL"
  echo "       • Session or Direct (5432)                     →  DIRECT_URL"
  echo "  2. Vercel → Project → Settings → Environment Variables"
  echo "     Add BOTH for Production AND Preview"
  echo "     Enable for: Production, Preview, Development"
  echo "     Scope: Available for Build + Runtime (not Runtime-only)"
  echo "  3. Redeploy without build cache"
  echo "  See SUPABASE.md / DEPLOY.md"
  echo ""
  exit 1
fi

if [[ "${MIGRATE_URL}" == *"localhost"* ]] || [[ "${MIGRATE_URL}" == *"127.0.0.1"* ]]; then
  echo ""
  echo "❌ DATABASE_URL/DIRECT_URL points at localhost — Vercel cannot reach your laptop DB."
  echo "   Use Supabase pooler URIs from the Supabase dashboard (…pooler.supabase.com…)."
  echo ""
  exit 1
fi

# DIRECT_URL preferred for migrate; fall back to DATABASE_URL if only one is set
export DIRECT_URL="${DIRECT_URL:-$MIGRATE_URL}"
export DATABASE_URL="${DATABASE_URL:-$MIGRATE_URL}"

echo "==> Prisma generate"
npx prisma generate

echo "==> Prisma migrate deploy (Supabase)"
npx prisma migrate deploy

echo "==> Next.js build"
npx next build
