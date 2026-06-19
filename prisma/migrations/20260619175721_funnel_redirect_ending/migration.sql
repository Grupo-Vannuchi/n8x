-- AlterEnum
ALTER TYPE "FunnelOutcome" ADD VALUE 'REDIRECTED';

-- AlterEnum
ALTER TYPE "FunnelType" ADD VALUE 'REDIRECT';

-- AlterTable
ALTER TABLE "funnel_endings" ADD COLUMN     "redirectButtonLabel" TEXT,
ADD COLUMN     "redirectDelaySeconds" INTEGER DEFAULT 3,
ADD COLUMN     "redirectUrl" TEXT;
