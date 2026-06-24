/*
  Warnings:

  - The `responsibility` column on the `curriculum_committee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Responsibility" AS ENUM ('member', 'responsible');

-- AlterTable
ALTER TABLE "curriculum_committee" DROP COLUMN "responsibility",
ADD COLUMN     "responsibility" "Responsibility" NOT NULL DEFAULT 'member';
