/*
  Warnings:

  - The values [normal,international,continuing,cooperative] on the enum `ProgramType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProgramType_new" AS ENUM ('new', 'revised');
ALTER TABLE "tb_curriculum" ALTER COLUMN "program_type" DROP DEFAULT;
ALTER TABLE "tb_curriculum" ALTER COLUMN "program_type" TYPE "ProgramType_new" USING ("program_type"::text::"ProgramType_new");
ALTER TYPE "ProgramType" RENAME TO "ProgramType_old";
ALTER TYPE "ProgramType_new" RENAME TO "ProgramType";
DROP TYPE "ProgramType_old";
ALTER TABLE "tb_curriculum" ALTER COLUMN "program_type" SET DEFAULT 'new';
COMMIT;

-- AlterTable
ALTER TABLE "tb_curriculum" ALTER COLUMN "program_type" SET DEFAULT 'new';
