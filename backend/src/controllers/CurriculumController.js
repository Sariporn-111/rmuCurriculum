import prisma from '../config/prisma.js'

// controllers/CurriculumController.js

export const getCourses = async ({ query, set, store }) => {
    try {
        const user = store.user;
        const role = user?.roles?.role_name;

        const { year, faculty_id, status } = query || {};

        let whereClause = {};

        if (role === "teacher") {
            const teacher = await prisma.teachers.findFirst({
                where: { user_id: user.id }
            });
            if (teacher) {
                whereClause.curriculum_committee = {
                    some: {
                        teacher_id: teacher.teacher_id
                    }
                };
            } else {
                whereClause.curriculum_id = -1;
            }
        }

        if (faculty_id && faculty_id !== 'all') {
            whereClause.departments = { faculty_id: Number(faculty_id) };
        }

        if (year && year !== 'all') {
            whereClause.curriculum_year = Number(year);
        }

        const courses = await prisma.tb_curriculum.findMany({
            where: whereClause,
            orderBy: { curriculum_id: 'desc' },
            include: {
                departments: {
                    include: { faculties: true }
                },
                curriculumProcesses: { orderBy: { step_order: "asc" } },
                curriculumCertifications: true,
                curriculumApprovals: true,
            }
        });

        return { data: courses };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const getCourseById = async ({ params, set }) => {
    try {
        const course = await prisma.tb_curriculum.findUnique({
            where: { curriculum_id: Number(params.id) },
            include: {
                departments: { include: { faculties: true } },
                curriculumProcesses: { orderBy: { step_order: "asc" } },
                curriculumCertifications: true,
                curriculumApprovals: true,
            }
        });
        return { data: course };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const createCourse = async ({ body, set, store }) => {
    try {
        // จุดที่ 1: guard curriculum_code ก่อน .trim() เพราะอาจเป็น undefined/empty
        if (body.curriculum_code?.trim()) {
            const duplicateCode = await prisma.tb_curriculum.findFirst({
                where: { curriculum_code: body.curriculum_code.trim() }
            });
            if (duplicateCode) {
                set.status = 400;
                return { error: "รหัสหลักสูตรนี้มีอยู่ในระบบแล้ว" };
            }
        }

        // ตรวจชื่อหลักสูตรซ้ำ
        const duplicateName = await prisma.tb_curriculum.findFirst({
            where: { curriculum_name_th: body.curriculum_name_th.trim() }
        });
        if (duplicateName) {
            set.status = 400;
            return { error: "ชื่อหลักสูตรนี้มีอยู่ในระบบแล้ว" };
        }

        const course = await prisma.tb_curriculum.create({
            data: {
                // ── 1.1 รหัสและชื่อหลักสูตร ──
                curriculum_code: body.curriculum_code?.trim() || null,
                curriculum_name_th: body.curriculum_name_th,
                curriculum_name_en: body.curriculum_name_en || null,

                // ── 1.2 ชื่อปริญญา ──
                degree_name_th: body.degree_name_th,
                degree_name_en: body.degree_name_en || null,
                degree_abbr_th: body.degree_abbr_th || null,
                degree_abbr_en: body.degree_abbr_en || null,

                // ── 1.3 วิชาเอก ──
                major_name: body.major_name || null,

                // ── 1.4 หน่วยกิต ──
                total_credits: Number(body.total_credits),

                // ── 1.5.1 รูปแบบหลักสูตร ──
                curriculum_format: body.curriculum_format || null,
                curriculum_format_other: body.curriculum_format_other || null,

                // ── 1.5.2 ประเภทหลักสูตร ──
                curriculum_category: body.curriculum_category || null,
                curriculum_category_other: body.curriculum_category_other || null,

                // ── 1.5.3 ภาษา ──
                teaching_language: body.teaching_language || null,
                teaching_language_other: body.teaching_language_other || null,

                // ── 1.5.4 การรับเข้า ──
                admission_type: body.admission_type || null,

                // ── 1.5.5 ความร่วมมือ ──
                cooperation_type: body.cooperation_type || null,
                cooperation_name: body.cooperation_name || null,

                // ── 1.5.6 การให้ปริญญา ──
                degree_award_type: body.degree_award_type || null,
                degree_award_detail: body.degree_award_detail || null,

                // ── 1.6 สถานภาพ ──
                curriculum_status: body.curriculum_status || 'new',
                old_curriculum_name: body.old_curriculum_name || null,
                old_curriculum_year: body.old_curriculum_year ? Number(body.old_curriculum_year) : null,
                start_term: body.start_term ? Number(body.start_term) : null,
                start_academic_year: body.start_academic_year ? Number(body.start_academic_year) : null,

                // ── ฟิลด์เดิม ──
                education_level: body.education_level,
                curriculum_year: Number(body.curriculum_year),

                // จุดที่ 2: ใช้ ?? แทน || เพราะ 0 เป็น valid value (หลักสูตรใหม่)
                revision_round: body.revision_round !== undefined && body.revision_round !== null
                    ? Number(body.revision_round)
                    : 0,

                end_year: body.end_year ? Number(body.end_year) : null,
                program_flag: body.program_flag || null,
                effective_date: body.effective_date ? new Date(body.effective_date) : null,
                close_date: body.close_date ? new Date(body.close_date) : null,
                department_id: Number(body.department_id),
            }
        });

        // ── สร้าง approval records ──
        if (Array.isArray(body.approvals) && body.approvals.length > 0) {
            await prisma.curriculum_approval.createMany({
                data: body.approvals
                    .filter(a => a.approval_type)
                    .map(a => ({
                        curriculum_id: course.curriculum_id,
                        approval_type: a.approval_type,
                        meeting_no: a.meeting_no || null,
                        approval_date: a.approval_date ? new Date(a.approval_date) : null,
                        note: a.note || null,
                    })),
                skipDuplicates: true,
            });
        }

        // ── สร้าง process steps ──
        await prisma.curriculum_process.createMany({
            data: [
                { curriculum_id: course.curriculum_id, step_order: 1, step_name: 'เสนอคณะ', status: 'current' },
                { curriculum_id: course.curriculum_id, step_order: 2, step_name: 'เสนอกรรมการวิชาการ', status: 'pending' },
                { curriculum_id: course.curriculum_id, step_order: 3, step_name: 'เสนอสภาวิชาการ', status: 'pending' },
                { curriculum_id: course.curriculum_id, step_order: 4, step_name: 'เสนอสภามหาวิทยาลัย', status: 'pending' },
                { curriculum_id: course.curriculum_id, step_order: 5, step_name: 'เสนอ สป.อว.', status: 'pending' },
                { curriculum_id: course.curriculum_id, step_order: 6, step_name: 'เผยแพร่หลักสูตร', status: 'pending' },
            ]
        });

        return { message: 'สร้างหลักสูตรสำเร็จ', data: course };

    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const updateCourse = async ({ params, body, set, store }) => {
    try {
        const id = Number(params.id);

        // จุดที่ 1: guard curriculum_code ก่อน .trim()
        if (body.curriculum_code?.trim()) {
            const duplicateCode = await prisma.tb_curriculum.findFirst({
                where: { curriculum_code: body.curriculum_code.trim(), NOT: { curriculum_id: id } }
            });
            if (duplicateCode) {
                set.status = 400;
                return { error: "รหัสหลักสูตรนี้มีอยู่ในระบบแล้ว" };
            }
        }

        const duplicateName = await prisma.tb_curriculum.findFirst({
            where: { curriculum_name_th: body.curriculum_name_th.trim(), NOT: { curriculum_id: id } }
        });
        if (duplicateName) {
            set.status = 400;
            return { error: "ชื่อหลักสูตรนี้มีอยู่ในระบบแล้ว" };
        }

        const course = await prisma.tb_curriculum.update({
            where: { curriculum_id: id },
            data: {
                // ── 1.1 ──
                curriculum_code: body.curriculum_code?.trim() || null,
                curriculum_name_th: body.curriculum_name_th,
                curriculum_name_en: body.curriculum_name_en || null,

                // ── 1.2 ──
                degree_name_th: body.degree_name_th,
                degree_name_en: body.degree_name_en || null,
                degree_abbr_th: body.degree_abbr_th || null,
                degree_abbr_en: body.degree_abbr_en || null,

                // ── 1.3 ──
                major_name: body.major_name || null,

                // ── 1.4 ──
                total_credits: Number(body.total_credits),

                // ── 1.5.1 ──
                curriculum_format: body.curriculum_format || null,
                curriculum_format_other: body.curriculum_format_other || null,

                // ── 1.5.2 ──
                curriculum_category: body.curriculum_category || null,
                curriculum_category_other: body.curriculum_category_other || null,

                // ── 1.5.3 ──
                teaching_language: body.teaching_language || null,
                teaching_language_other: body.teaching_language_other || null,

                // ── 1.5.4 ──
                admission_type: body.admission_type || null,

                // ── 1.5.5 ──
                cooperation_type: body.cooperation_type || null,
                cooperation_name: body.cooperation_name || null,

                // ── 1.5.6 ──
                degree_award_type: body.degree_award_type || null,
                degree_award_detail: body.degree_award_detail || null,

                // ── 1.6 ──
                curriculum_status: body.curriculum_status || 'new',
                old_curriculum_name: body.old_curriculum_name || null,
                old_curriculum_year: body.old_curriculum_year ? Number(body.old_curriculum_year) : null,
                start_term: body.start_term ? Number(body.start_term) : null,
                start_academic_year: body.start_academic_year ? Number(body.start_academic_year) : null,

                // ── เดิม ──
                education_level: body.education_level,
                curriculum_year: Number(body.curriculum_year),

                // จุดที่ 2: ใช้ ?? แทน || เพราะ 0 เป็น valid value
                revision_round: body.revision_round !== undefined && body.revision_round !== null
                    ? Number(body.revision_round)
                    : 0,

                end_year: body.end_year ? Number(body.end_year) : null,
                program_flag: body.program_flag || null,
                effective_date: body.effective_date ? new Date(body.effective_date) : null,
                close_date: body.close_date ? new Date(body.close_date) : null,

                // จุดที่ 3: เพิ่ม department_id (หายไปใน updateCourse เดิม!)
                department_id: Number(body.department_id),

                updated_at: new Date(),
            }
        });

        // ── sync approvals: ลบของเก่าแล้วสร้างใหม่ ──
        if (Array.isArray(body.approvals)) {
            await prisma.curriculum_approval.deleteMany({ where: { curriculum_id: id } });
            if (body.approvals.length > 0) {
                await prisma.curriculum_approval.createMany({
                    data: body.approvals
                        .filter(a => a.approval_type)
                        .map(a => ({
                            curriculum_id: id,
                            approval_type: a.approval_type,
                            meeting_no: a.meeting_no || null,
                            approval_date: a.approval_date ? new Date(a.approval_date) : null,
                            note: a.note || null,
                        })),
                });
            }
        }

        return { message: 'อัปเดตหลักสูตรสำเร็จ', data: course };

    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const deleteCourse = async ({ params, set }) => {
    try {
        await prisma.tb_curriculum.delete({
            where: { curriculum_id: Number(params.id) }
        });
        return { message: 'Deleted success' };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};