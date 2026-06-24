/*
  Warnings:

  - You are about to drop the column `program_type` on the `tb_curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `start_use_year` on the `tb_curriculum` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('new', 'revised');

-- CreateEnum
CREATE TYPE "CurriculumFormat" AS ENUM ('bachelor_4_year', 'bachelor_5_year', 'bachelor_continuing', 'master', 'doctoral', 'other');

-- CreateEnum
CREATE TYPE "CurriculumCategory" AS ENUM ('academic', 'advanced_academic', 'professional', 'advanced_professional', 'other');

-- CreateEnum
CREATE TYPE "TeachingLanguage" AS ENUM ('thai', 'english', 'thai_english', 'other');

-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('thai_only', 'foreign_only', 'thai_and_foreign_thai_language', 'thai_and_foreign');

-- CreateEnum
CREATE TYPE "CooperationType" AS ENUM ('internal', 'collaborative');

-- CreateEnum
CREATE TYPE "DegreeAwardType" AS ENUM ('single', 'multiple');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('faculty_committee', 'curriculum_committee', 'academic_council', 'university_council', 'professional_council');

-- AlterTable
ALTER TABLE "tb_curriculum" DROP COLUMN "program_type",
DROP COLUMN "start_use_year",
ADD COLUMN     "admission_type" "AdmissionType",
ADD COLUMN     "cooperation_name" VARCHAR(255),
ADD COLUMN     "cooperation_type" "CooperationType",
ADD COLUMN     "curriculum_category" "CurriculumCategory",
ADD COLUMN     "curriculum_category_other" TEXT,
ADD COLUMN     "curriculum_format" "CurriculumFormat",
ADD COLUMN     "curriculum_format_other" TEXT,
ADD COLUMN     "curriculum_status" "CurriculumStatus" NOT NULL DEFAULT 'new',
ADD COLUMN     "degree_award_detail" TEXT,
ADD COLUMN     "degree_award_type" "DegreeAwardType",
ADD COLUMN     "major_name" VARCHAR(255),
ADD COLUMN     "meeting_round" VARCHAR(50),
ADD COLUMN     "old_curriculum_name" VARCHAR(255),
ADD COLUMN     "old_curriculum_year" INTEGER,
ADD COLUMN     "start_academic_year" INTEGER,
ADD COLUMN     "start_term" INTEGER,
ADD COLUMN     "teaching_language" "TeachingLanguage",
ADD COLUMN     "teaching_language_other" TEXT;

-- DropEnum
DROP TYPE "ProgramType";

-- CreateTable
CREATE TABLE "curriculum_approval" (
    "approval_id" SERIAL NOT NULL,
    "curriculum_id" INTEGER NOT NULL,
    "approval_type" "ApprovalType" NOT NULL,
    "meeting_no" VARCHAR(50),
    "approval_date" DATE,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_approval_pkey" PRIMARY KEY ("approval_id")
);

-- AddForeignKey
ALTER TABLE "curriculum_approval" ADD CONSTRAINT "curriculum_approval_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE CASCADE;
