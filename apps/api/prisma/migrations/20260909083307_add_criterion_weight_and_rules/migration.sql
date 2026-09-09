-- AlterTable
ALTER TABLE "Criterion" ADD COLUMN     "ruleConfig" JSONB,
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 0;
