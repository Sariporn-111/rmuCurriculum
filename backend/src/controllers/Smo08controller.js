import prisma from "../config/prisma.js";
import { mkdirSync, existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR);

// ─── ดึงรายการทั้งหมด ─────────────────────────────────────────────────────────
export const getSmo08List = async ({ query, store }) => {
    try {
        const { search, faculty } = query || {};
        const user = store?.user;
        const role = user?.roles?.role_name;

        let curriculumFilter = {};
        if (role === "teacher") {
            const teacher = await prisma.teachers.findFirst({
                where: { user_id: user.id }
            });
            if (teacher) {
                curriculumFilter = {
                    tb_curriculum: {
                        curriculum_committee: {
                            some: {
                                teacher_id: teacher.teacher_id
                            }
                        }
                    }
                };
            } else {
                curriculumFilter = {
                    curriculum_id: -1
                };
            }
        }

        const result = await prisma.smo08.findMany({
            where: {
                AND: [
                    curriculumFilter,
                    search ? {
                        tb_curriculum: {
                            curriculum_name_th: { contains: search, mode: "insensitive" }
                        }
                    } : {},
                    faculty ? {
                        faculty: { contains: faculty, mode: "insensitive" }
                    } : {},
                ],
            },
            include: {
                tb_curriculum: {
                    select: {
                        curriculum_name_th: true,
                        curriculum_name_en: true,
                        departments: { include: { faculties: true } }
                    }
                }
            },
            orderBy: { smo08_id: "desc" },
        });

        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// ─── ดึงรายการเดียว ───────────────────────────────────────────────────────────
export const getSmo08ById = async ({ params }) => {
    try {
        const result = await prisma.smo08.findUnique({
            where: { smo08_id: Number(params.id) },
            include: {
                tb_curriculum: {
                    select: {
                        curriculum_name_th: true,
                        curriculum_name_en: true,
                        departments: { include: { faculties: true } }
                    }
                }
            },
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// ─── เจ้าหน้าที่สร้างเอกสาร (เลือกหลักสูตร + อัปโหลดไฟล์ + หมายเหตุ) ─────────
//     ข้อมูลวิชาการ (improve_round, year, reason ฯลฯ) อาจารย์จะกรอกภายหลัง
export const createSmo08 = async ({ body, set }) => {
    try {
        const curriculum = await prisma.tb_curriculum.findUnique({
            where: { curriculum_id: Number(body.curriculum_id) },
            include: { departments: { include: { faculties: true } } }
        });

        if (!curriculum) { set.status = 404; return { error: "ไม่พบหลักสูตร" }; }

        // ดึงคณะ/สาขาจาก DB ไม่รับจาก body
        const facultyName = curriculum.departments?.faculties?.faculty_name_th ?? "";
        const majorName = curriculum.departments?.department_name_th ?? "";

        let filePath = null;
        if (body.file) {
            const fileName = `${Date.now()}-${body.file.name}`;
            filePath = `/uploads/${fileName}`;
            await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await body.file.arrayBuffer()));
        }

        const result = await prisma.smo08.create({
            data: {
                curriculum_id: Number(body.curriculum_id),
                faculty: facultyName,
                major: majorName,
                improve_round: body.improve_round || "",
                year: body.year || "",
                // ─── optional ───────────────────────────────────
                reason: body.note || null,  // ใช้ note เป็น reason เบื้องต้น
                file_path: filePath,
            },
        });

        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// ─── เจ้าหน้าที่แก้ไขเอกสาร (เปลี่ยนหลักสูตรหรือไฟล์) ──────────────────────
export const updateSmo08 = async ({ params, body, set }) => {
    try {
        const curriculum = await prisma.tb_curriculum.findUnique({
            where: { curriculum_id: Number(body.curriculum_id) },
            include: { departments: { include: { faculties: true } } }
        });

        if (!curriculum) { set.status = 404; return { error: "ไม่พบหลักสูตร" }; }

        const facultyName = curriculum.departments?.faculties?.faculty_name_th ?? "";
        const majorName = curriculum.departments?.department_name_th ?? "";

        let filePath = undefined;
        if (body.file) {
            const fileName = `${Date.now()}-${body.file.name}`;
            filePath = `/uploads/${fileName}`;
            await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await body.file.arrayBuffer()));
        }

        const result = await prisma.smo08.update({
            where: { smo08_id: Number(params.id) },
            data: {
                curriculum_id: Number(body.curriculum_id),
                faculty: facultyName,
                major: majorName,
                improve_round: body.improve_round !== undefined ? body.improve_round : undefined,
                year: body.year !== undefined ? body.year : undefined,
                reason: body.note ?? undefined,
                ...(filePath !== undefined && { file_path: filePath }),
            },
        });

        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// ─── อาจารย์กรอกข้อมูลวิชาการ ────────────────────────────────────────────────
//     endpoint แยกต่างหาก ไม่ใช้ multipart (ไม่มีไฟล์)
export const updateSmo08Academic = async ({ params, body, set }) => {
    try {
        const result = await prisma.smo08.update({
            where: { smo08_id: Number(params.id) },
            data: {
                improve_round: body.improve_round || undefined,
                year: body.year || undefined,
                approve_date: body.approve_date ? new Date(body.approve_date) : undefined,
                start_term: body.start_term || undefined,
                start_year: body.start_year || undefined,
                reason: body.reason || undefined,
                old_structure: body.old_structure || undefined,
                new_structure: body.new_structure || undefined,
            },
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// ─── ลบ ──────────────────────────────────────────────────────────────────────
export const deleteSmo08 = async ({ params, set }) => {
    try {
        await prisma.smo08.delete({ where: { smo08_id: Number(params.id) } });
        return { message: "ลบสำเร็จ" };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};