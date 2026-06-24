/*
  Warnings:

  - You are about to drop the `tb_teachers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tb_teachers" DROP CONSTRAINT "fk_teacher_department";

-- DropTable
DROP TABLE "tb_teachers";
