-- CreateTable
CREATE TABLE "smo08" (
    "smo08_id" SERIAL NOT NULL,
    "curriculum_id" INTEGER NOT NULL,
    "faculty" VARCHAR(255) NOT NULL,
    "major" VARCHAR(255) NOT NULL,
    "improve_round" VARCHAR(50) NOT NULL,
    "year" VARCHAR(10) NOT NULL,
    "approve_date" DATE,
    "start_term" VARCHAR(50),
    "start_year" VARCHAR(10),
    "reason" TEXT,
    "old_structure" TEXT,
    "new_structure" TEXT,
    "file_path" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "smo08_pkey" PRIMARY KEY ("smo08_id")
);

-- AddForeignKey
ALTER TABLE "smo08" ADD CONSTRAINT "smo08_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE CASCADE;
