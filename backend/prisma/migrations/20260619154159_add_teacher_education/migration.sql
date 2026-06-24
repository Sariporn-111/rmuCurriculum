-- CreateTable
CREATE TABLE "teacher_education" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "degree_level" "EducationLevel" NOT NULL,
    "degree_name" VARCHAR(200),
    "major" VARCHAR(200),
    "faculty_name" VARCHAR(255),
    "university_name" VARCHAR(255) NOT NULL,
    "country" VARCHAR(100),
    "graduation_year" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "teacher_education_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_education_teacher_id_degree_level_key" ON "teacher_education"("teacher_id", "degree_level");

-- AddForeignKey
ALTER TABLE "teacher_education" ADD CONSTRAINT "teacher_education_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;
