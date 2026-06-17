-- Submissions: record which ending the lead reached.
ALTER TABLE "funnel_submissions" ADD COLUMN "endingName" TEXT;

-- CreateTable: funnel_endings
CREATE TABLE "funnel_endings" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "key" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "type" "FunnelType" NOT NULL,
    "completionMessage" TEXT NOT NULL,
    "meetingDurationMinutes" INTEGER DEFAULT 30,
    "meetingSlotStartHour" INTEGER DEFAULT 9,
    "meetingSlotEndHour" INTEGER DEFAULT 18,
    "meetingDaysAhead" INTEGER DEFAULT 14,
    "meetingTimezone" TEXT DEFAULT 'America/Sao_Paulo',
    "bonusUrl" TEXT,
    "bonusButtonLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_endings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_endings_funnelId_order_idx" ON "funnel_endings"("funnelId", "order");

-- AddForeignKey
ALTER TABLE "funnel_endings" ADD CONSTRAINT "funnel_endings_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: move each existing funnel's ending into a default ending row
-- (runs BEFORE the columns below are dropped, so no data is lost).
INSERT INTO "funnel_endings" (
    "id", "funnelId", "order", "key", "name", "type", "completionMessage",
    "meetingDurationMinutes", "meetingSlotStartHour", "meetingSlotEndHour",
    "meetingDaysAhead", "meetingTimezone", "bonusUrl", "bonusButtonLabel",
    "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text, "id", 0, gen_random_uuid()::text, 'Final', "type",
    COALESCE("completionMessage", ''),
    "meetingDurationMinutes", "meetingSlotStartHour", "meetingSlotEndHour",
    "meetingDaysAhead", "meetingTimezone", "bonusUrl", "bonusButtonLabel",
    now(), now()
FROM "funnels";

-- DropIndex
DROP INDEX "funnels_status_type_idx";

-- AlterTable: drop the columns now living on funnel_endings
ALTER TABLE "funnels" DROP COLUMN "bonusButtonLabel",
DROP COLUMN "bonusUrl",
DROP COLUMN "completionMessage",
DROP COLUMN "meetingDaysAhead",
DROP COLUMN "meetingDurationMinutes",
DROP COLUMN "meetingSlotEndHour",
DROP COLUMN "meetingSlotStartHour",
DROP COLUMN "meetingTimezone",
DROP COLUMN "messageBody",
DROP COLUMN "type";

-- CreateIndex
CREATE INDEX "funnels_status_idx" ON "funnels"("status");
