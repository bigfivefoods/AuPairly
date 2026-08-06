-- Stripe Connect: map users → connected account + platform subscription fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "connectSubscriptionStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "connectSubscriptionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");
