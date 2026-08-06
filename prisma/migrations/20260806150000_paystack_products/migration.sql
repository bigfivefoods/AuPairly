-- Seller products for Paystack storefront
CREATE TABLE IF NOT EXISTS "MarketplaceProduct" (
    "id" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MarketplaceProduct_sellerUserId_active_idx" ON "MarketplaceProduct"("sellerUserId", "active");
