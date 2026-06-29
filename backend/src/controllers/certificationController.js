import prisma from "../config/prisma.js";
import { mkdirSync, existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR);

/* ─── helper: save file ─────────────────────────────────── */
const saveFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `/uploads/${fileName}`;
    await writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()));
    return filePath;
};

/* ─── GET /certifications ───────────────────────────────── */
export const getCertifications = async ({ store }) => {
    const user = store?.user;
    const role = user?.roles?.role_name;

    let curriculumFilter = {};
    if (role === "teacher") {
        const teacher = await prisma.teachers.findFirst({
            where: { user_id: user.id }
        });
        if (teacher) {
            curriculumFilter = {
                curriculum_committee: {
                    some: {
                        teacher_id: teacher.teacher_id
                    }
                }
            };
        } else {
            curriculumFilter = {
                curriculum_id: -1
            };
        }
    }

    const result = await prisma.curriculum_certification.findMany({
        where: {
            tb_curriculum: curriculumFilter
        },
        include: {
            tb_curriculum: {
                select: {
                    curriculum_id: true,
                    curriculum_code: true,       // ✅ ต้องมีตรงนี้
                    curriculum_name_th: true,
                    departments: {
                        include: { faculties: true },
                    },
                },
            },
        },
        orderBy: { certification_id: "desc" },
    });
    return { data: result };
};

/* ─── POST /certifications ──────────────────────────────── */
export const createCertification = async ({ body, set }) => {
    try {
        const filePath = body.file ? await saveFile(body.file) : null;

        const result = await prisma.curriculum_certification.create({
            data: {
                curriculum_id: Number(body.curriculum_id),
                certification_type: body.certification_type,
                agency: body.agency,
                recipient: body.recipient || null, // ✅ ส่งถึงใคร
                doc_number: body.doc_number || null,
                issue_date: body.issue_date ? new Date(body.issue_date) : null,
                received_date: body.received_date ? new Date(body.received_date) : null,
                received_time: body.received_time || null, // ✅ เวลาที่รับ
                request_date: body.request_date ? new Date(body.request_date) : null,
                approve_date: body.approve_date ? new Date(body.approve_date) : null, // ✅ สป.อว อนุมัติ
                note: body.note || null,
                file_path: filePath,
            },
        });

        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

/* ─── PUT /certifications/:id ───────────────────────────── */
export const updateCertification = async ({ params, body, set }) => {
    try {
        const filePath = body.file ? await saveFile(body.file) : undefined;

        const result = await prisma.curriculum_certification.update({
            where: { certification_id: Number(params.id) },
            data: {
                curriculum_id: Number(body.curriculum_id),
                certification_type: body.certification_type,
                agency: body.agency,
                recipient: body.recipient || null,
                doc_number: body.doc_number || null,
                issue_date: body.issue_date ? new Date(body.issue_date) : null,
                received_date: body.received_date ? new Date(body.received_date) : null,
                received_time: body.received_time || null,
                request_date: body.request_date ? new Date(body.request_date) : null,
                approve_date: body.approve_date ? new Date(body.approve_date) : null,
                note: body.note || null,
                status: body.status || undefined,
                ...(filePath !== undefined && { file_path: filePath }),
            },
        });

        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

/* ─── DELETE /certifications/:id ────────────────────────── */
export const deleteCertification = async ({ params, set }) => {
    try {
        await prisma.curriculum_certification.delete({
            where: { certification_id: Number(params.id) },
        });
        return { message: "ลบสำเร็จ" };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};