/*
  Warnings:

  - You are about to drop the column `aiKeywords` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `SaleTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `SaleTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `awsAccessKeyId` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `awsRegion` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `awsSecretAccessKey` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `s3BucketName` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `storeAddress` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `SupportTicket` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `itemType` on the `SaleTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SaleItemType" AS ENUM ('PRODUCT', 'SERVICE');

-- DropForeignKey
ALTER TABLE "SaleTransaction" DROP CONSTRAINT "SaleTransaction_productId_fkey";

-- DropForeignKey
ALTER TABLE "SaleTransaction" DROP CONSTRAINT "SaleTransaction_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_ticketId_fkey";

-- DropIndex
DROP INDEX "Service_name_key";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "aiKeywords",
DROP COLUMN "quantity",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "SaleTransaction" DROP COLUMN "productId",
DROP COLUMN "serviceId",
DROP COLUMN "itemType",
ADD COLUMN     "itemType" "SaleItemType" NOT NULL,
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "awsAccessKeyId",
DROP COLUMN "awsRegion",
DROP COLUMN "awsSecretAccessKey",
DROP COLUMN "s3BucketName",
DROP COLUMN "storeAddress";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropTable
DROP TABLE "SupportTicket";

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
