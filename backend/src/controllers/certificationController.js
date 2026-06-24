import prisma from "../config/prisma";
import { mkdirSync, existsSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR);
}

/* ─────────────────────────────
   GET /certifications
───────────────────────────── */
export const getCertifications = async () => {
    const result = await prisma.curriculum_certification.findMany({
        include: {
            tb_curriculum: {
                include: {
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

/* ─────────────────────────────
   helper: save uploaded file
───────────────────────────── */
const saveFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `/uploads/${fileName}`;
    await writeFile(
        path.join(UPLOAD_DIR, fileName),
        Buffer.from(await file.arrayBuffer())
    );
    return filePath;
};

/* ─────────────────────────────
   POST /certifications
───────────────────────────── */
export const createCertification = async ({ body }) => {
    try {
        const filePath = body.file ? await saveFile(body.file) : null;

        return await prisma.curriculum_certification.create({
            data: {
                curriculum_id: Number(body.curriculum_id),
                certification_type: body.certification_type,
                agency: body.agency,
                doc_number: body.doc_number || null,
                issue_date: body.issue_date ? new Date(body.issue_date) : null,
                received_date: body.received_date ? new Date(body.received_date) : null,
                // เก็บ field เดิมไว้ด้วยเผื่อใช้
                request_date: body.request_date ? new Date(body.request_date) : null,
                approve_date: body.approve_date ? new Date(body.approve_date) : null,
                note: body.note || null,
                file_path: filePath,
            },
        });
    } catch (err) {
        return { error: err.message };
    }
};

/* ─────────────────────────────
   PUT /certifications/:id
───────────────────────────── */
export const updateCertification = async ({ params, body }) => {
    try {
        // อัปโหลดไฟล์ใหม่เฉพาะเมื่อมีการส่งมา
        const filePath = body.file ? await saveFile(body.file) : undefined;

        return await prisma.curriculum_certification.update({
            where: { certification_id: Number(params.id) },
            data: {
                curriculum_id: Number(body.curriculum_id),
                certification_type: body.certification_type,
                agency: body.agency,
                doc_number: body.doc_number || null,
                issue_date: body.issue_date ? new Date(body.issue_date) : null,
                received_date: body.received_date ? new Date(body.received_date) : null,
                request_date: body.request_date ? new Date(body.request_date) : null,
                approve_date: body.approve_date ? new Date(body.approve_date) : null,
                note: body.note || null,
                status: body.status || undefined,
                // filePath = undefined → Prisma ไม่แตะ field นี้ (คงไฟล์เดิม)
                ...(filePath !== undefined && { file_path: filePath }),
            },
        });
    } catch (err) {
        return { error: err.message };
    }
};

/* ─────────────────────────────
   DELETE /certifications/:id
───────────────────────────── */
export const deleteCertification = async ({ params }) => {
    try {
        await prisma.curriculum_certification.delete({
            where: { certification_id: Number(params.id) },
        });
        return { message: "ลบสำเร็จ" };
    } catch (err) {
        return { error: err.message };
    }
};