-- CreateEnum
CREATE TYPE "FunnelType" AS ENUM ('MEETING', 'BONUS', 'MESSAGE');

-- CreateEnum
CREATE TYPE "FunnelStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FunnelOutcome" AS ENUM ('COMPLETED', 'MEETING_BOOKED', 'BONUS_DOWNLOADED', 'MESSAGE_SENT');

-- CreateEnum
CREATE TYPE "WhatsappStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "funnels" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pt',
    "name" TEXT NOT NULL,
    "type" "FunnelType" NOT NULL,
    "status" "FunnelStatus" NOT NULL DEFAULT 'DRAFT',
    "defaultBlock" JSONB NOT NULL DEFAULT '[]',
    "completionMessage" TEXT NOT NULL,
    "meetingDurationMinutes" INTEGER DEFAULT 30,
    "meetingSlotStartHour" INTEGER DEFAULT 9,
    "meetingSlotEndHour" INTEGER DEFAULT 18,
    "meetingDaysAhead" INTEGER DEFAULT 14,
    "meetingTimezone" TEXT DEFAULT 'America/Sao_Paulo',
    "bonusUrl" TEXT,
    "bonusButtonLabel" TEXT,
    "messageBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_questions" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_submissions" (
    "id" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "phoneE164" TEXT,
    "email" TEXT,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "outcome" "FunnelOutcome" NOT NULL DEFAULT 'COMPLETED',
    "meetingStartAt" TIMESTAMP(3),
    "googleEventId" TEXT,
    "whatsappStatus" "WhatsappStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappError" TEXT,
    "submissionToken" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pt',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_account" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiryDate" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funnel_default_templates" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funnel_default_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funnels_slug_key" ON "funnels"("slug");

-- CreateIndex
CREATE INDEX "funnels_status_type_idx" ON "funnels"("status", "type");

-- CreateIndex
CREATE INDEX "funnel_questions_funnelId_order_idx" ON "funnel_questions"("funnelId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_submissions_submissionToken_key" ON "funnel_submissions"("submissionToken");

-- CreateIndex
CREATE INDEX "funnel_submissions_funnelId_createdAt_idx" ON "funnel_submissions"("funnelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_default_templates_locale_key" ON "funnel_default_templates"("locale");

-- AddForeignKey
ALTER TABLE "funnel_questions" ADD CONSTRAINT "funnel_questions_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funnel_submissions" ADD CONSTRAINT "funnel_submissions_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
