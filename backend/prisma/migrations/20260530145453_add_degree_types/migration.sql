-- CreateTable
CREATE TABLE "degree_types" (
    "id" SERIAL NOT NULL,
    "education_level" "EducationLevel" NOT NULL,
    "name_th" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200),
    "abbr_th" VARCHAR(20),
    "abbr_en" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "degree_types_pkey" PRIMARY KEY ("id")
);
