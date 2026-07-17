/*
  Warnings:

  - The `currentStep` column on the `executions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "executions" DROP COLUMN "currentStep",
ADD COLUMN     "currentStep" INTEGER NOT NULL DEFAULT 0;
