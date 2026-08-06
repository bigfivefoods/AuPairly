#!/usr/bin/env bash
# Vercel build: prisma generate → optional migrate → next build
#
# DATABASE_URL / DIRECT_URL are required at *runtime* for the app.
# They should also be available at *Build* time so migrations run here.
# If missing at build (common misconfig: "Runtime only"), we still produce a
# deployable Next.js build and skip migrate with a loud warning.
set -euo pipefail

echo "==> Prisma generate"
npx prisma generate

MIGRATE_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

if [[ -z "${MIGRATE_URL}" ]]; then
  echo ""
  echo "⚠️  DATABASE_URL / DIRECT_URL not visible to this build."
  echo "   Skipping prisma migrate deploy."
  echo ""
  echo "   Fix so migrations + app both work:"
  echo "   Vercel → aupairly → Settings → Environment Variables"
  echo "     DATABASE_URL  = Supabase Transaction pooler (:6543, ?pgbouncer=true)"
  echo "     DIRECT_URL    = Supabase Session/Direct (:5432)"
  echo "   For each: Production + Preview, and enable **Build** and **Runtime**."
  echo "   Then redeploy."
  echo "   (You can also run: npx prisma migrate deploy locally against Supabase.)"
  echo ""
elif [[ "${MIGRATE_URL}" == *"localhost"* ]] || [[ "${MIGRATE_URL}" == *"127.0.0.1"* ]]; then
  echo ""
  echo "⚠️  DATABASE_URL/DIRECT_URL points at localhost — skipping migrate on Vercel."
  echo "   Use Supabase pooler URIs (…pooler.supabase.com…), not localhost."
  echo ""
else
  export DIRECT_URL="${DIRECT_URL:-$MIGRATE_URL}"
  export DATABASE_URL="${DATABASE_URL:-$MIGRATE_URL}"
  echo "==> Prisma migrate deploy (Supabase)"
  # Don't fail the whole site deploy if migrate has a transient pooler blip;
  # log and continue so next build still ships. Check logs if schema drifts.
  if ! npx prisma migrate deploy; then
    echo ""
    echo "⚠️  prisma migrate deploy failed — continuing with next build."
    echo "   Apply migrations manually: npx prisma migrate deploy (with DIRECT_URL)."
    echo ""
  fi
fi

echo "==> Next.js build"
npx next build
