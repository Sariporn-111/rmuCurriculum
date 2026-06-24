// src/controllers/CurriculumProcessController.js
import prisma from '../config/prisma.js'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'process-files')

// สร้าง folder ถ้ายังไม่มี
const ensureDir = async () => {
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })
}

// ─── UPDATE STATUS (เดิม + รองรับ file upload) ───────────────────────────────
export const updateProcessStatus = async ({ params, body, set }) => {
    try {
        const processId = Number(params.id)

        const currentProcess = await prisma.curriculum_process.findUnique({
            where: { process_id: processId }
        })

        if (!currentProcess) {
            set.status = 404
            return { error: 'ไม่พบขั้นตอน' }
        }

        // ── UPDATE CURRENT STEP ──
        await prisma.curriculum_process.update({
            where: { process_id: processId },
            data: {
                status: body.status,
                note: body.note || null,
                process_date: new Date()
            }
        })

        // ── CASE: ผ่าน ──
        if (body.status === 'done') {
            const nextStep = await prisma.curriculum_process.findFirst({
                where: {
                    curriculum_id: currentProcess.curriculum_id,
                    step_order: currentProcess.step_order + 1
                }
            })
            if (nextStep) {
                await prisma.curriculum_process.update({
                    where: { process_id: nextStep.process_id },
                    data: { status: 'current' }
                })
            }
        }

        // ── CASE: ส่งกลับแก้ไข ──
        if (body.status === 'rejected') {
            await prisma.curriculum_process.updateMany({
                where: {
                    curriculum_id: currentProcess.curriculum_id,
                    step_order: { gt: currentProcess.step_order }
                },
                data: { status: 'pending' }
            })
        }

        // ── CASE: ส่งกลับเข้าพิจารณา ──
        if (body.status === 'resubmitted') {
            await prisma.curriculum_process.update({
                where: { process_id: processId },
                data: { status: 'current', process_date: new Date() }
            })
        }

        return { message: 'อัปเดตสถานะสำเร็จ' }
    } catch (err) {
        console.error(err)
        set.status = 500
        return { error: err.message }
    }
}

// ─── UPLOAD FILE ─────────────────────────────────────────────────────────────
export const uploadProcessFile = async ({ params, body, set }) => {
    try {
        const processId = Number(params.id)

        const process = await prisma.curriculum_process.findUnique({
            where: { process_id: processId }
        })
        if (!process) {
            set.status = 404
            return { error: 'ไม่พบขั้นตอน' }
        }

        if (!body.file) {
            set.status = 400
            return { error: 'ไม่พบไฟล์ที่อัปโหลด' }
        }

        await ensureDir()

        const originalName = body.file.name
        const ext = path.extname(originalName)
        const safeName = `process_${processId}_${Date.now()}${ext}`
        const filePath = `/uploads/process-files/${safeName}`

        await writeFile(
            path.join(UPLOAD_DIR, safeName),
            Buffer.from(await body.file.arrayBuffer())
        )

        const updated = await prisma.curriculum_process.update({
            where: { process_id: processId },
            data: { file_path: filePath, file_name: originalName }
        })

        return { message: 'อัปโหลดไฟล์สำเร็จ', data: updated }
    } catch (err) {
        console.error(err)
        set.status = 500
        return { error: err.message }
    }
}

// ─── DELETE FILE ──────────────────────────────────────────────────────────────
export const deleteProcessFile = async ({ params, set }) => {
    try {
        const processId = Number(params.id)

        await prisma.curriculum_process.update({
            where: { process_id: processId },
            data: { file_path: null, file_name: null }
        })

        return { message: 'ลบไฟล์สำเร็จ' }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}