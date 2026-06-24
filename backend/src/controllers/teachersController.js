import prisma from '../config/prisma.js'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const IMAGE_DIR = path.join(process.cwd(), 'images')
if (!existsSync(IMAGE_DIR)) mkdirSync(IMAGE_DIR)

const VALID_DEGREE_LEVELS = ['bachelor', 'master', 'doctoral']

const EDITABLE_PROFILE_FIELDS = [
    'title_name', 'first_name_th', 'last_name_th',
    'first_name_en', 'last_name_en',
    'academic_position', 'administrative_position',
    'employment_type', 'email', 'phone', 'remark',
]

// ─── สำหรับ admin/officer ──────────────────────────────────────────────────────

export const getTeachers = async () => {
    return await prisma.teachers.findMany({
        include: {
            users: { select: { username: true, email: true } },
            teacher_education: true,
        },
        orderBy: { teacher_id: 'asc' }
    })
}

// ✅ สร้างอาจารย์ใหม่ พร้อมบันทึกประวัติการศึกษาใน transaction เดียว
//    body.education = [{ degree_level, degree_name, major, faculty_name, university_name, country, graduation_year }]
export const createTeacher = async ({ body, set }) => {
    try {
        const educationRecords = Array.isArray(body.education)
            ? body.education.filter(e =>
                VALID_DEGREE_LEVELS.includes(e.degree_level) &&
                (e.university_name || '').trim()
            )
            : []

        const result = await prisma.$transaction(async (tx) => {
            // 1. สร้าง teacher
            const teacher = await tx.teachers.create({
                data: {
                    user_id: body.user_id || null,
                    employee_code: body.employee_code,
                    title_name: body.title_name || '',
                    first_name_th: body.first_name_th,
                    last_name_th: body.last_name_th,
                    first_name_en: body.first_name_en || null,
                    last_name_en: body.last_name_en || null,
                    academic_position: body.academic_position || null,
                    administrative_position: body.administrative_position || null,
                    highest_degree: body.highest_degree || null,
                    major_degree: body.major_degree || null,
                    university_graduated: body.university_graduated || null,
                    country_graduate: body.country_graduate || null,
                    email: body.email || null,
                    phone: body.phone || null,
                    employment_type: body.employment_type || null,
                    employment_status: body.employment_status || null,
                    hire_date: body.hire_date ? new Date(body.hire_date) : null,
                    is_active: body.is_active ?? true,
                    department_id: body.department_id || null,
                }
            })

            // 2. บันทึกประวัติการศึกษา (ถ้ามี)
            if (educationRecords.length > 0) {
                await tx.teacher_education.createMany({
                    data: educationRecords.map(e => ({
                        teacher_id: teacher.teacher_id,
                        degree_level: e.degree_level,
                        degree_name: e.degree_name || null,
                        major: e.major || null,
                        faculty_name: e.faculty_name || null,
                        university_name: e.university_name.trim(),
                        country: e.country || null,
                        graduation_year: e.graduation_year ? Number(e.graduation_year) : null,
                    }))
                })
            }

            return teacher
        })

        return result
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const updateTeacher = async ({ params, body }) => {
    try {
        return await prisma.teachers.update({
            where: { teacher_id: Number(params.id) },
            data: {
                title_name: body.title_name,
                first_name_th: body.first_name_th,
                last_name_th: body.last_name_th,
                first_name_en: body.first_name_en,
                last_name_en: body.last_name_en,
                academic_position: body.academic_position,
                highest_degree: body.highest_degree,
                major_degree: body.major_degree,
                email: body.email,
                phone: body.phone,
                employment_type: body.employment_type,
                employment_status: body.employment_status,
                is_active: body.is_active,
                updated_at: new Date()
            }
        })
    } catch (err) {
        return { error: err.message }
    }
}

export const deleteTeacher = async ({ params }) => {
    try {
        await prisma.teachers.delete({ where: { teacher_id: Number(params.id) } })
        return { message: 'ลบสำเร็จ' }
    } catch (err) {
        return { error: err.message }
    }
}

// ─── สำหรับอาจารย์จัดการโปรไฟล์ตัวเอง ────────────────────────────────────────

export const getMyProfile = async ({ store, set }) => {
    const user = store.user
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    try {
        let teacher = await prisma.teachers.findFirst({
            where: { user_id: user.id },
            include: {
                users: {
                    select: { username: true, email: true, phone: true, title: true, first_name: true, last_name: true }
                }
            }
        })

        if (!teacher) {
            const userInfo = await prisma.users.findUnique({ where: { id: user.id } })
            teacher = await prisma.teachers.create({
                data: {
                    user_id: user.id,
                    employee_code: `EMP${user.id}`,
                    title_name: userInfo.title || '',
                    first_name_th: userInfo.first_name || '',
                    last_name_th: userInfo.last_name || '',
                    email: userInfo.email || '',
                    phone: userInfo.phone || null,
                },
                include: {
                    users: {
                        select: { username: true, email: true, phone: true, title: true, first_name: true, last_name: true }
                    }
                }
            })
        }

        return { data: teacher }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const updateMyProfile = async ({ store, body, set }) => {
    const user = store.user
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    try {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (!teacher) { set.status = 404; return { error: 'ไม่พบข้อมูลอาจารย์' } }

        const data = {}
        for (const field of EDITABLE_PROFILE_FIELDS) {
            if (body[field] !== undefined) data[field] = body[field] || null
        }
        data.updated_at = new Date()

        const result = await prisma.$transaction(async (tx) => {
            const updatedTeacher = await tx.teachers.update({
                where: { teacher_id: teacher.teacher_id },
                data
            })

            const userData = {}
            if (body.title_name !== undefined) userData.title = body.title_name || ''
            if (body.first_name_th !== undefined) userData.first_name = body.first_name_th || ''
            if (body.last_name_th !== undefined) userData.last_name = body.last_name_th || ''
            if (body.email !== undefined) userData.email = body.email || ''
            if (body.phone !== undefined) userData.phone = body.phone || null

            if (Object.keys(userData).length > 0) {
                userData.updated_at = new Date()
                await tx.users.update({
                    where: { id: user.id },
                    data: userData
                })
            }

            return updatedTeacher
        })

        return { data: result }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const getMyEducation = async ({ store, set }) => {
    const user = store.user
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    try {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (!teacher) { set.status = 404; return { error: 'ไม่พบข้อมูลอาจารย์' } }

        const education = await prisma.teacher_education.findMany({
            where: { teacher_id: teacher.teacher_id }
        })
        return { data: education }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const updateMyEducation = async ({ store, body, set }) => {
    const user = store.user
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    try {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (!teacher) { set.status = 404; return { error: 'ไม่พบข้อมูลอาจารย์' } }

        const records = Array.isArray(body.education) ? body.education : []
        const results = []

        for (const rec of records) {
            if (!VALID_DEGREE_LEVELS.includes(rec.degree_level)) continue
            const universityName = (rec.university_name || '').trim()

            if (!universityName) {
                await prisma.teacher_education.deleteMany({
                    where: { teacher_id: teacher.teacher_id, degree_level: rec.degree_level }
                })
                continue
            }

            const saved = await prisma.teacher_education.upsert({
                where: {
                    teacher_id_degree_level: {
                        teacher_id: teacher.teacher_id,
                        degree_level: rec.degree_level,
                    }
                },
                update: {
                    degree_name: rec.degree_name || null,
                    major: rec.major || null,
                    faculty_name: rec.faculty_name || null,
                    university_name: universityName,
                    country: rec.country || null,
                    graduation_year: rec.graduation_year ? Number(rec.graduation_year) : null,
                },
                create: {
                    teacher_id: teacher.teacher_id,
                    degree_level: rec.degree_level,
                    degree_name: rec.degree_name || null,
                    major: rec.major || null,
                    faculty_name: rec.faculty_name || null,
                    university_name: universityName,
                    country: rec.country || null,
                    graduation_year: rec.graduation_year ? Number(rec.graduation_year) : null,
                },
            })
            results.push(saved)
        }

        return { data: results }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const uploadProfileImage = async ({ store, body, set }) => {
    const user = store.user
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    try {
        if (!body.file) { set.status = 400; return { error: 'ไม่พบไฟล์' } }

        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (!teacher) { set.status = 404; return { error: 'ไม่พบข้อมูลอาจารย์' } }

        const ext = body.file.name.split('.').pop()
        const fileName = `profile_${teacher.teacher_id}_${Date.now()}.${ext}`
        const filePath = `/images/${fileName}`

        await writeFile(
            path.join(IMAGE_DIR, fileName),
            Buffer.from(await body.file.arrayBuffer())
        )

        const result = await prisma.teachers.update({
            where: { teacher_id: teacher.teacher_id },
            data: { profile_image: filePath }
        })

        return { data: { profile_image: result.profile_image } }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}
