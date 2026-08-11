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
# Confirmed production project
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-prj_Xkd1WRxncxzJRvTp6FrY7s4l2VcG}"
export VERCEL_ORG_ID="${VERCEL_ORG_ID:-team_oGAZjNJBveFmWZpLsHDCVVhK}"
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
export AUTO_VERIFY="${AUTO_VERIFY:-false}"

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

# VerifyNow (SA KYC)
set_env VERIFYNOW_API_KEY "${VERIFYNOW_API_KEY:-}"
set_env VERIFYNOW_MODE "${VERIFYNOW_MODE:-production}"
set_env KYC_VERIFYNOW_FEE_CENTS "${KYC_VERIFYNOW_FEE_CENTS:-1000}"

# Didit (international KYC — live)
set_env DIDIT_API_KEY "${DIDIT_API_KEY:-}"
set_env DIDIT_WORKFLOW_ID "${DIDIT_WORKFLOW_ID:-}"
set_env DIDIT_WEBHOOK_SECRET "${DIDIT_WEBHOOK_SECRET:-}"
set_env DIDIT_API_BASE "${DIDIT_API_BASE:-https://verification.didit.me/v3}"

# Meta Facebook
set_env NEXT_PUBLIC_FACEBOOK_APP_ID "${NEXT_PUBLIC_FACEBOOK_APP_ID:-${AUTH_FACEBOOK_ID:-}}"
set_env AUTH_FACEBOOK_SECRET "${AUTH_FACEBOOK_SECRET:-${FACEBOOK_APP_SECRET:-}}"

# Privy — email OTP before registration (required for /register in production)
# NEXT_PUBLIC_* must be available at Build + Runtime on Vercel
set_env NEXT_PUBLIC_PRIVY_APP_ID "${NEXT_PUBLIC_PRIVY_APP_ID:-${PRIVY_APP_ID:-}}"
set_env PRIVY_APP_ID "${PRIVY_APP_ID:-${NEXT_PUBLIC_PRIVY_APP_ID:-}}"
set_env PRIVY_APP_SECRET "${PRIVY_APP_SECRET:-}"
set_env PRIVY_EMAIL_VERIFY_REQUIRED "${PRIVY_EMAIL_VERIFY_REQUIRED:-true}"
set_env PRIVY_VERIFICATION_KEY "${PRIVY_VERIFICATION_KEY:-}"
set_env NEXT_PUBLIC_PRIVY_CLIENT_ID "${NEXT_PUBLIC_PRIVY_CLIENT_ID:-}"

echo "Triggering production redeploy..."
npx vercel --prod --yes "${TOKEN_FLAG[@]}"

echo ""
echo "Done. Check:"
echo "  https://www.aupairly.me/verification"
echo "  https://www.aupairly.me/register  (Privy OTP when NEXT_PUBLIC_PRIVY_APP_ID is set)"
echo "Didit live when GET /api/verification/kyc shows didit.live=true (logged in)."
echo "Privy: setup card gone when App ID is in the production build."
