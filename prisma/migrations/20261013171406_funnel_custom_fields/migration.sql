-- CreateEnum
CREATE TYPE "FunnelInputType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CPF', 'CNPJ', 'URL');

-- AlterTable
ALTER TABLE "funnel_questions" ADD COLUMN     "fieldName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "inputType" "FunnelInputType" NOT NULL DEFAULT 'TEXT';
