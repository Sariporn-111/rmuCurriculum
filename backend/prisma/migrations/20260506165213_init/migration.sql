-- CreateTable
CREATE TABLE "curriculum_committee" (
    "committee_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "committee_role" VARCHAR(100) NOT NULL,
    "responsibility" VARCHAR(50) DEFAULT 'member',
    "appointed_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_committee_pkey" PRIMARY KEY ("committee_id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "department_name_th" VARCHAR(255) NOT NULL,
    "department_name_en" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" SERIAL NOT NULL,
    "faculty_name_th" VARCHAR(255) NOT NULL,
    "faculty_name_en" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "tb_curriculum" (
    "curriculum_id" SERIAL NOT NULL,
    "seq_no" VARCHAR(50) NOT NULL,
    "curriculum_code" VARCHAR(255) NOT NULL,
    "curriculum_name_th" VARCHAR(255) NOT NULL,
    "curriculum_name_en" VARCHAR(255) NOT NULL,
    "degree_name_th" VARCHAR(100) NOT NULL,
    "degree_name_en" VARCHAR(100) NOT NULL,
    "curriculum_type" VARCHAR(50) NOT NULL,
    "education_level" VARCHAR(50) NOT NULL,
    "program_type" BOOLEAN NOT NULL,
    "total_credits" INTEGER NOT NULL,
    "curriculum_year" INTEGER NOT NULL,
    "revision_round" INTEGER NOT NULL,
    "effective_date" TIMESTAMP(6) NOT NULL,
    "start_use_year" TIMESTAMP(6) NOT NULL,
    "close_date" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" INTEGER NOT NULL,

    CONSTRAINT "tb_curriculum_pkey" PRIMARY KEY ("curriculum_id")
);

-- CreateTable
CREATE TABLE "tb_teachers" (
    "teacher_id" SERIAL NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "title_name" VARCHAR(50) NOT NULL,
    "first_name_th" VARCHAR(50) NOT NULL,
    "last_name_th" VARCHAR(100) NOT NULL,
    "first_name_en" VARCHAR(100) NOT NULL,
    "last_name_en" VARCHAR(100) NOT NULL,
    "academic_position" VARCHAR(100) NOT NULL,
    "administrative_position" VARCHAR(100) NOT NULL,
    "highest_degree" VARCHAR(30) NOT NULL,
    "major_degree" VARCHAR(100) NOT NULL,
    "university_graduated" VARCHAR(100) NOT NULL,
    "country_graduate" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "remark" TEXT NOT NULL,
    "employment_type" VARCHAR(30) NOT NULL,
    "employment_status" VARCHAR(50) NOT NULL,
    "hire_date" DATE NOT NULL,
    "retire_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "department_id" INTEGER NOT NULL,
    "profile_image" VARCHAR(255),

    CONSTRAINT "tb_teachers_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "teacher_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "employee_code" VARCHAR(50) NOT NULL,
    "title_name" VARCHAR(50) NOT NULL,
    "first_name_th" VARCHAR(100) NOT NULL,
    "last_name_th" VARCHAR(100) NOT NULL,
    "first_name_en" VARCHAR(100),
    "last_name_en" VARCHAR(100),
    "academic_position" VARCHAR(100),
    "administrative_position" VARCHAR(100),
    "highest_degree" VARCHAR(30),
    "major_degree" VARCHAR(100),
    "university_graduated" VARCHAR(100),
    "country_graduate" VARCHAR(100),
    "email" VARCHAR(120),
    "phone" VARCHAR(10),
    "employment_type" VARCHAR(30),
    "employment_status" VARCHAR(50),
    "hire_date" DATE,
    "retire_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "department_id" INTEGER,
    "remark" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "title" VARCHAR(10) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_committee_course_id_teacher_id_key" ON "curriculum_committee"("course_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "curriculum_committee" ADD CONSTRAINT "curriculum_committee_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "tb_curriculum"("curriculum_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "curriculum_committee" ADD CONSTRAINT "curriculum_committee_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_curriculum" ADD CONSTRAINT "tb_curriculum_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_teachers" ADD CONSTRAINT "fk_teacher_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
