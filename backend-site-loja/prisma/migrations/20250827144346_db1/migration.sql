/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Address` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `paymentProvider` on the `Order` table. All the data in the column will be lost.
  - You are about to alter the column `totalAmount` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `createdAt` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Plan` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Plan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `storePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `imageUrl` on the `ProductReview` table. All the data in the column will be lost.
  - You are about to alter the column `pricePerItem` on the `SaleTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `totalAmount` on the `SaleTransaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `price` on the `Service` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `createdAt` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `geminiApiKey` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the `CourseReview` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `ProductReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `PendingService` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `itemType` on the `SaleTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `userId` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Made the column `siteDescription` on table `SiteSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovedCourseAccess" DROP CONSTRAINT "ApprovedCourseAccess_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovedCourseAccess" DROP CONSTRAINT "ApprovedCourseAccess_userId_fkey";

-- DropForeignKey
ALTER TABLE "CourseAccessRequest" DROP CONSTRAINT "CourseAccessRequest_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseAccessRequest" DROP CONSTRAINT "CourseAccessRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "CourseReview" DROP CONSTRAINT "CourseReview_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CourseReview" DROP CONSTRAINT "CourseReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "PendingService" DROP CONSTRAINT "PendingService_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductQuestion" DROP CONSTRAINT "ProductQuestion_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductReview" DROP CONSTRAINT "ProductReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_userId_fkey";

-- DropIndex
DROP INDEX "ProductQuestion_productId_idx";

-- DropIndex
DROP INDEX "ProductQuestion_userId_idx";

-- DropIndex
DROP INDEX "ProductReview_productId_idx";

-- DropIndex
DROP INDEX "ProductReview_productId_userId_key";

-- DropIndex
DROP INDEX "ProductReview_userId_idx";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentProvider",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PendingService" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "priority" DROP DEFAULT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "status",
DROP COLUMN "storePrice",
DROP COLUMN "updatedAt",
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProductReview" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "PurchaseRequest" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SaleTransaction" ALTER COLUMN "pricePerItem" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION,
DROP COLUMN "itemType",
ADD COLUMN     "itemType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "createdAt",
DROP COLUMN "geminiApiKey",
DROP COLUMN "updatedAt",
ALTER COLUMN "siteDescription" SET NOT NULL,
ALTER COLUMN "siteDescription" SET DEFAULT 'Sua loja de tecnologia e assessoria.',
ALTER COLUMN "faviconUrl" SET DEFAULT '/favicon.ico';

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "asaasSubscriptionId" DROP NOT NULL;

-- DropTable
DROP TABLE "CourseReview";

-- DropEnum
DROP TYPE "SaleItemType";

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_userId_productId_key" ON "ProductReview"("userId", "productId");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductQuestion" ADD CONSTRAINT "ProductQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccessRequest" ADD CONSTRAINT "CourseAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAccessRequest" ADD CONSTRAINT "CourseAccessRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedCourseAccess" ADD CONSTRAINT "ApprovedCourseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedCourseAccess" ADD CONSTRAINT "ApprovedCourseAccess_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingService" ADD CONSTRAINT "PendingService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
