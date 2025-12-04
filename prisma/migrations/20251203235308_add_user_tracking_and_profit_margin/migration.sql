/*
  Warnings:

  - You are about to alter the column `unitPrice` on the `items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `subtotal` on the `items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `totalAmount` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `profit` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "items" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "profitMargin" DECIMAL(5,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "profit" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "userId" UUID;

-- CreateIndex
CREATE INDEX "items_normalizedName_idx" ON "items"("normalizedName");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_createdAt_idx" ON "sessions"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
