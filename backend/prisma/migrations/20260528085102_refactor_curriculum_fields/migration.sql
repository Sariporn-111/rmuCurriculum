/*
  Warnings:

  - You are about to drop the column `curriculum_type` on the `tb_curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `seq_no` on the `tb_curriculum` table. All the data in the column will be lost.
  - You are about to alter the column `curriculum_code` on the `tb_curriculum` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - The `program_type` column on the `tb_curriculum` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `start_use_year` column on the `tb_curriculum` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `education_level` on the `tb_curriculum` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('bachelor', 'master', 'doctoral');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('normal', 'international', 'continuing', 'cooperative');

-- AlterTable
ALTER TABLE "tb_curriculum" DROP COLUMN "curriculum_type",
DROP COLUMN "seq_no",
ADD COLUMN     "degree_abbr_en" VARCHAR(20),
ADD COLUMN     "degree_abbr_th" VARCHAR(20),
ALTER COLUMN "curriculum_code" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "curriculum_name_en" DROP NOT NULL,
ALTER COLUMN "degree_name_en" DROP NOT NULL,
DROP COLUMN "education_level",
ADD COLUMN     "education_level" "EducationLevel" NOT NULL,
DROP COLUMN "program_type",
ADD COLUMN     "program_type" "ProgramType" NOT NULL DEFAULT 'normal',
ALTER COLUMN "revision_round" SET DEFAULT 1,
ALTER COLUMN "effective_date" DROP NOT NULL,
ALTER COLUMN "effective_date" SET DATA TYPE DATE,
DROP COLUMN "start_use_year",
ADD COLUMN     "start_use_year" INTEGER,
ALTER COLUMN "close_date" SET DATA TYPE DATE;
