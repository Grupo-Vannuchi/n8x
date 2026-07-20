-- CreateEnum
CREATE TYPE "FunnelQuestionKind" AS ENUM ('CHOICE', 'TEXT');

-- AlterTable
ALTER TABLE "funnel_questions" ADD COLUMN     "kind" "FunnelQuestionKind" NOT NULL DEFAULT 'CHOICE',
ADD COLUMN     "next" TEXT NOT NULL DEFAULT '';
