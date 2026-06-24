-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('pending', 'current', 'done', 'rejected');

-- CreateTable
CREATE TABLE "curriculum_process" (
    "process_id" SERIAL NOT NULL,
    "curriculum_id" INTEGER NOT NULL,
    "step_order" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" "ProcessStatus" NOT NULL DEFAULT 'pending',
    "process_date" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_process_pkey" PRIMARY KEY ("process_id")
);

-- AddForeignKey
ALTER TABLE "curriculum_process" ADD CONSTRAINT "curriculum_process_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE CASCADE;
