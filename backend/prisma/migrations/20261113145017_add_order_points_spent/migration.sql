/*
  Warnings:

  - Added the required column `subTotal` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promotionCode" TEXT,
ADD COLUMN     "subTotal" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "pointCost" INTEGER DEFAULT 0;
