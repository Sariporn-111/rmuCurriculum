-- เปลี่ยน certification_type จาก enum → varchar โดยไม่ drop ข้อมูล
ALTER TABLE "curriculum_certification" 
  ALTER COLUMN "certification_type" TYPE VARCHAR(100) 
  USING "certification_type"::text;

-- เพิ่ม field ใหม่
ALTER TABLE "curriculum_certification" 
  ADD COLUMN IF NOT EXISTS "doc_number" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "issue_date" DATE,
  ADD COLUMN IF NOT EXISTS "received_date" DATE;

-- ลบ enum เก่า (ถ้ามี)
DROP TYPE IF EXISTS "CertificationType";