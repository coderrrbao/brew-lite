/*
  Warnings:

  - The values [EXPIRED,PAYMENT_FAILED,PAYMENT_SUCCESS] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `pointCost` on table `Promotion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PAID', 'FAILED', 'PENDING');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Promotion" ALTER COLUMN "pointCost" SET NOT NULL;

-- CreateTable
CREATE TABLE "SizeOption" (
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceAdd" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SizeOption_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "Topping" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Topping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedeemedVoucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionCode" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedeemedVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionCode" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RedeemedVoucher_userId_idx" ON "RedeemedVoucher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RedeemedVoucher_userId_promotionCode_key" ON "RedeemedVoucher"("userId", "promotionCode");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherUsage_orderId_key" ON "VoucherUsage"("orderId");

-- CreateIndex
CREATE INDEX "VoucherUsage_userId_promotionCode_idx" ON "VoucherUsage"("userId", "promotionCode");

-- AddForeignKey
ALTER TABLE "RedeemedVoucher" ADD CONSTRAINT "RedeemedVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedeemedVoucher" ADD CONSTRAINT "RedeemedVoucher_promotionCode_fkey" FOREIGN KEY ("promotionCode") REFERENCES "Promotion"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherUsage" ADD CONSTRAINT "VoucherUsage_promotionCode_fkey" FOREIGN KEY ("promotionCode") REFERENCES "Promotion"("code") ON DELETE CASCADE ON UPDATE CASCADE;
