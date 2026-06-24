-- AlterTable
ALTER TABLE "tb_curriculum" ADD COLUMN     "program_flag" VARCHAR(50);

-- CreateTable
CREATE TABLE "curriculum_ohe_tracking" (
    "tracking_id" SERIAL NOT NULL,
    "curriculum_id" INTEGER NOT NULL,
    "ohe_status" VARCHAR(20) NOT NULL,
    "submitted_date" DATE,
    "note" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "curriculum_ohe_tracking_pkey" PRIMARY KEY ("tracking_id")
);

-- AddForeignKey
ALTER TABLE "curriculum_ohe_tracking" ADD CONSTRAINT "curriculum_ohe_tracking_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_ohe_tracking" ADD CONSTRAINT "curriculum_ohe_tracking_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
