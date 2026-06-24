// src/controllers/OheTrackingController.js
import prisma from '../config/prisma.js'

// ─── GET ทั้งหมดของหลักสูตรนั้น ───────────────────────────────────────────────
export const getOheTrackingByCurriculum = async ({ params, set }) => {
    try {
        const trackings = await prisma.curriculum_ohe_tracking.findMany({
            where: { curriculum_id: Number(params.curriculumId) },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: { id: true, first_name: true, last_name: true }
                }
            }
        })
        return { data: trackings }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

// ─── GET ล่าสุดของหลักสูตรนั้น (สำหรับแสดงในตารางรายงาน) ────────────────────
export const getLatestOheTracking = async ({ params, set }) => {
    try {
        const tracking = await prisma.curriculum_ohe_tracking.findFirst({
            where: { curriculum_id: Number(params.curriculumId) },
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: { id: true, first_name: true, last_name: true }
                }
            }
        })
        return { data: tracking }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createOheTracking = async ({ body, set, store }) => {
    try {
        const userId = store.user?.id ?? null

        const tracking = await prisma.curriculum_ohe_tracking.create({
            data: {
                curriculum_id:  Number(body.curriculum_id),
                ohe_status:     body.ohe_status,
                submitted_date: body.submitted_date ? new Date(body.submitted_date) : null,
                note:           body.note || null,
                created_by:     userId,
            }
        })
        return { message: 'บันทึกสถานะ อว. สำเร็จ', data: tracking }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateOheTracking = async ({ params, body, set }) => {
    try {
        const tracking = await prisma.curriculum_ohe_tracking.update({
            where: { tracking_id: Number(params.id) },
            data: {
                ohe_status:     body.ohe_status,
                submitted_date: body.submitted_date ? new Date(body.submitted_date) : null,
                note:           body.note || null,
            }
        })
        return { message: 'แก้ไขสถานะ อว. สำเร็จ', data: tracking }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteOheTracking = async ({ params, set }) => {
    try {
        await prisma.curriculum_ohe_tracking.delete({
            where: { tracking_id: Number(params.id) }
        })
        return { message: 'ลบสถานะ อว. สำเร็จ' }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}