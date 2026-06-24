import prisma from '../config/prisma.js'

// controllers/MeetingController.js
// จัดการ curriculum_approval records (บันทึกการประชุมแต่ละครั้ง)

// ── GET: ดึงประวัติการประชุมทั้งหมดของหลักสูตร ──
export const getMeetingsByCurriculum = async ({ params, set }) => {
    try {
        const curriculumId = Number(params.id);

        const meetings = await prisma.curriculum_approval.findMany({
            where: { curriculum_id: curriculumId },
            orderBy: [
                { approval_type: 'asc' },
                { approval_date: 'asc' },
                { approval_id: 'asc' },
            ],
        });

        // จัดกลุ่มตาม approval_type
        const grouped = {};
        for (const m of meetings) {
            if (!grouped[m.approval_type]) grouped[m.approval_type] = [];
            grouped[m.approval_type].push(m);
        }

        return { data: grouped };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// ── POST: เพิ่มการประชุมใหม่ ──
export const addMeeting = async ({ params, body, set }) => {
    try {
        console.log("POST BODY =", body);
        console.log("CURRICULUM ID =", params.id);
        const curriculumId = Number(params.id);

        if (!curriculumId || Number.isNaN(curriculumId)) {
            set.status = 400;
            return { error: 'รหัสหลักสูตรไม่ถูกต้อง (curriculum_id ไม่ใช่ตัวเลข)' };
        }

        if (!body.approval_type) {
            set.status = 400;
            return { error: 'กรุณาระบุขั้นตอนการพิจารณา' };
        }

        const meeting = await prisma.curriculum_approval.create({
            data: {
                curriculum_id: curriculumId,
                approval_type: body.approval_type,
                meeting_no: body.meeting_no || null,
                approval_date: body.approval_date ? new Date(body.approval_date) : null,
                approval_month: body.approval_month ? Number(body.approval_month) : null,
                approval_year: body.approval_year ? Number(body.approval_year) : null,
                result: body.result || null,
                note: body.note || null,
            },
        });
        console.log("CREATED =", meeting);
        return { message: 'เพิ่มการประชุมสำเร็จ', data: meeting };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// ── PUT: แก้ไขการประชุม ──
export const updateMeeting = async ({ params, body, set }) => {
    try {
        const approvalId = Number(params.approvalId);

        const meeting = await prisma.curriculum_approval.update({
            where: { approval_id: approvalId },
            data: {
                meeting_no: body.meeting_no || null,
                approval_date: body.approval_date ? new Date(body.approval_date) : null,
                approval_month: body.approval_month ? Number(body.approval_month) : null,
                approval_year: body.approval_year ? Number(body.approval_year) : null,
                result: body.result || null,
                note: body.note || null,
            },
        });

        return { message: 'แก้ไขการประชุมสำเร็จ', data: meeting };
    } catch (err) {
        set.status = 500;
        return { error: err.message };

    }
};

// ── DELETE: ลบการประชุม ──
export const deleteMeeting = async ({ params, set }) => {
    try {
        const approvalId = Number(params.approvalId);

        await prisma.curriculum_approval.delete({
            where: { approval_id: approvalId },
        });

        return { message: 'ลบการประชุมสำเร็จ' };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};