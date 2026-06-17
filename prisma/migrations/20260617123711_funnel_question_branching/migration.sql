-- AlterTable
ALTER TABLE "funnel_questions" ADD COLUMN     "key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "optionNext" TEXT[] DEFAULT ARRAY[]::TEXT[];
