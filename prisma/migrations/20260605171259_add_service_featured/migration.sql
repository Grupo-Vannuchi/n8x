-- DropIndex
DROP INDEX "services_published_order_idx";

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "services_published_featured_order_idx" ON "services"("published", "featured", "order");
