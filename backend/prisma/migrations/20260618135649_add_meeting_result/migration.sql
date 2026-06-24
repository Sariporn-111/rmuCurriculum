-- CreateEnum
CREATE TYPE "MeetingResult" AS ENUM ('approved', 'revision', 'rejected');

-- AlterTable
ALTER TABLE "curriculum_approval" ADD COLUMN     "result" "MeetingResult";
