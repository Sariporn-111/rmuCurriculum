-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "profile_image" VARCHAR(255);

-- CreateTable
CREATE TABLE "academic_committee" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "duty" TEXT,
    "appointed_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "academic_committee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "academic_committee" ADD CONSTRAINT "academic_committee_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;
