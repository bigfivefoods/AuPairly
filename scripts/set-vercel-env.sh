#!/usr/bin/env bash
# Push required Production + Preview env vars to Vercel project "aupairly".
# Usage:
#   export VERCEL_TOKEN=...   # https://vercel.com/account/tokens
#   ./scripts/set-vercel-env.sh
# Or after: npx vercel login
set -euo pipefail

cd "$(dirname "$0")/.."

TEAM_SCOPE="${VERCEL_SCOPE:-bigfivefoods-projects}"
PROJECT="${VERCEL_PROJECT:-aupairly}"
TOKEN_FLAG=()
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  TOKEN_FLAG=(--token "$VERCEL_TOKEN")
fi

if [[ ! -f .env ]]; then
  echo "Missing .env — copy from vercel-env-to-paste.env or .env.example first"
  exit 1
fi

# Load .env
set -a
# shellcheck disable=SC1091
source <(grep -E '^[A-Z_][A-Z0-9_]*=' .env | sed 's/^/export /')
set +a

# Production site URLs (override local .env)
export AUTH_URL="${AUTH_URL_PROD:-https://www.aupairly.me}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL_PROD:-https://www.aupairly.me}"
export NEXT_PUBLIC_SITE_NAME="${NEXT_PUBLIC_SITE_NAME:-AuPairly}"
export AUTO_VERIFY="${AUTO_VERIFY:-true}"

# Strong auth secret if still the local default
if [[ -z "${AUTH_SECRET:-}" || "$AUTH_SECRET" == *"change-me"* || "$AUTH_SECRET" == *"dev-secret"* ]]; then
  AUTH_SECRET="$(openssl rand -base64 32)"
  echo "Generated new AUTH_SECRET for production"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL missing in .env"
  exit 1
fi

echo "Linking project $PROJECT (scope $TEAM_SCOPE)..."
npx vercel link --yes --project "$PROJECT" --scope "$TEAM_SCOPE" "${TOKEN_FLAG[@]}" 2>/dev/null || \
  npx vercel link --yes --project "$PROJECT" --scope "$TEAM_SCOPE" "${TOKEN_FLAG[@]}"

set_env() {
  local key="$1"
  local val="${2:-}"
  if [[ -z "$val" ]]; then
    echo "  skip empty $key"
    return 0
  fi
  echo "  set $key (production + preview)"
  for env in production preview; do
    printf '%s' "$val" | npx vercel env add "$key" "$env" --force --yes "${TOKEN_FLAG[@]}" 2>/dev/null \
      || printf '%s' "$val" | npx vercel env add "$key" "$env" --force "${TOKEN_FLAG[@]}" || true
  done
}

echo "Setting environment variables..."
set_env DATABASE_URL "$DATABASE_URL"
set_env DIRECT_URL "${DIRECT_URL:-$DATABASE_URL}"
set_env AUTH_SECRET "$AUTH_SECRET"
set_env AUTH_URL "$AUTH_URL"
set_env NEXT_PUBLIC_SITE_URL "$NEXT_PUBLIC_SITE_URL"
set_env NEXT_PUBLIC_SITE_NAME "$NEXT_PUBLIC_SITE_NAME"
set_env AUTO_VERIFY "$AUTO_VERIFY"
set_env NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}"
set_env PAYSTACK_SECRET_KEY "${PAYSTACK_SECRET_KEY:-}"
set_env NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY "${NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:-}"
set_env PAYSTACK_CURRENCY "${PAYSTACK_CURRENCY:-ZAR}"

echo "Triggering production redeploy..."
npx vercel --prod --yes "${TOKEN_FLAG[@]}"

echo ""
echo "Done. Check: https://www.aupairly.me/childcare"
echo "Listings should load once DATABASE_URL is live on Production (Build + Runtime)."
