-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('OCSC', 'OTEPC');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "curriculum_certification" (
    "certification_id" SERIAL NOT NULL,
    "curriculum_id" INTEGER NOT NULL,
    "certification_type" "CertificationType" NOT NULL,
    "agency" VARCHAR(255) NOT NULL,
    "request_date" DATE,
    "approve_date" DATE,
    "file_path" VARCHAR(255),
    "note" TEXT,
    "status" "CertificationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "curriculum_certification_pkey" PRIMARY KEY ("certification_id")
);

-- AddForeignKey
ALTER TABLE "curriculum_certification" ADD CONSTRAINT "curriculum_certification_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE CASCADE;
