#!/usr/bin/env bash
# Vercel build: generate client → migrate → next build
set -euo pipefail

echo "==> Prisma generate"
npx prisma generate

# Prefer direct (non-pooler) URL for migrations — Supabase Session/Direct :5432
MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL:-${POSTGRES_URL_NON_POOLING:-${POSTGRES_URL:-}}}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo ""
  echo "❌ DATABASE_URL / DIRECT_URL is not set on this Vercel project."
  echo ""
  echo "Fix (this is why the build failed):"
  echo "  1. Supabase → https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database"
  echo "     Connection string → URI → copy:"
  echo "       • Transaction pooler (6543)  →  DATABASE_URL"
  echo "       • Session or Direct (5432)   →  DIRECT_URL"
  echo "  2. Vercel → https://vercel.com/bigfivefoods-projects/aupairly/settings/environment-variables"
  echo "     Add DATABASE_URL and DIRECT_URL for Production AND Preview"
  echo "     (leave 'Sensitive' off or on as you like; both Build and Runtime)"
  echo "  3. Redeploy"
  echo ""
  exit 1
fi

# Ensure Prisma config can read them (DIRECT_URL preferred for migrate)
export DIRECT_URL="${DIRECT_URL:-$MIGRATE_URL}"
export DATABASE_URL="${DATABASE_URL:-$MIGRATE_URL}"

echo "==> Prisma migrate deploy"
npx prisma migrate deploy

echo "==> Next.js build"
npx next build
