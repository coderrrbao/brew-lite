-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'EXPIRED', 'PAYMENT_FAILED', 'PAYMENT_SUCCESS');

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
