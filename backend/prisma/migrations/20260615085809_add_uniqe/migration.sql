/*
  Warnings:

  - A unique constraint covering the columns `[curriculum_code]` on the table `tb_curriculum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[curriculum_name_th]` on the table `tb_curriculum` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tb_curriculum_curriculum_code_key" ON "tb_curriculum"("curriculum_code");

-- CreateIndex
CREATE UNIQUE INDEX "tb_curriculum_curriculum_name_th_key" ON "tb_curriculum"("curriculum_name_th");
