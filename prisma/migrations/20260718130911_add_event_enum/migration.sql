/*
  Warnings:

  - Changed the type of `event` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EXECUTION_CREATED', 'EXECUTION_STARTED', 'EXECUTION_COMPLETED', 'EXECUTION_FAILED', 'TASK_CREATED', 'TASK_STARTED', 'TASK_COMPLETED', 'TASK_FAILED', 'TASK_RETRY', 'SAGA_STARTED', 'SAGA_COMPLETED', 'SAGA_FAILED', 'COMPENSATION_STARTED', 'COMPENSATION_COMPLETED', 'COMPENSATION_FAILED');

-- AlterTable
ALTER TABLE "events" DROP COLUMN "event",
ADD COLUMN     "event" "EventType" NOT NULL;
