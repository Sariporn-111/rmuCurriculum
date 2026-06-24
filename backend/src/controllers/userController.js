import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'

const TEACHER_ROLE_ID = 3

// แก้เฉพาะ getUsers — เพิ่ม include teachers เพื่อดึง phone, faculty_id, department_id
export const getUsers = async () => {
    const users = await prisma.users.findMany({
        include: {
            roles: true,
            teachers: {
                select: {
                    teacher_id: true,
                    phone: true,
                    department_id: true,
                    // ไม่มี relation departments ใน teachers → ดึงแค่ department_id
                }
            }
        },
        orderBy: { id: 'asc' }
    })

    // ดึง department_id ทั้งหมดที่มี แล้วไป query departments แยก
    const deptIds = [...new Set(
        users.map(u => u.teachers?.department_id).filter(Boolean)
    )]

    const departments = deptIds.length > 0
        ? await prisma.departments.findMany({
            where: { id: { in: deptIds } },
            include: { faculties: true }
        })
        : []

    const deptMap = Object.fromEntries(departments.map(d => [d.id, d]))

    return users.map(u => {
        const dept = deptMap[u.teachers?.department_id] ?? null
        return {
            ...u,
            role_name: u.roles?.role_name ?? null,
            phone: u.phone ?? u.teachers?.phone ?? null,
            department_id: u.teachers?.department_id ?? null,
            faculty_id: dept?.faculty_id ?? null,
            department: dept?.department_name_th ?? null,
            faculty: dept?.faculties?.faculty_name_th ?? null,
        }
    })
}
// ✅ ดึงอาจารย์ที่ยังไม่มีบัญชีผู้ใช้ (user_id = null) สำหรับ admin ใช้เลือกเชื่อม
export const getUnlinkedTeachers = async () => {
    const teachers = await prisma.teachers.findMany({
        where: { user_id: null },
        orderBy: { teacher_id: 'asc' },
        select: {
            teacher_id: true,
            title_name: true,
            first_name_th: true,
            last_name_th: true,
            academic_position: true,
            email: true,
            employee_code: true,
            department_id: true,  // ← เพิ่ม
        }
    })

    // ดึง faculty_id จาก departments
    const deptIds = [...new Set(teachers.map(t => t.department_id).filter(Boolean))]
    const departments = deptIds.length > 0
        ? await prisma.departments.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, faculty_id: true }
        })
        : []
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d]))

    return {
        data: teachers.map(t => ({
            ...t,
            faculty_id: deptMap[t.department_id]?.faculty_id ?? null,  // ← เพิ่ม
        }))
    }
}
export const createUser = async ({ body, set }) => {
    try {
        // เช็ค email ซ้ำ
        const existEmail = await prisma.users.findFirst({ where: { email: body.email } })
        if (existEmail) { set.status = 400; return { error: 'อีเมลนี้มีในระบบแล้ว' } }

        // เช็ค username ซ้ำ
        const existUsername = await prisma.users.findFirst({ where: { username: body.username } })
        if (existUsername) { set.status = 400; return { error: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' } }

        const hashedPassword = await bcrypt.hash(body.password, 10)

        const newUser = await prisma.users.create({
            data: {
                username: body.username.trim(),
                password_hash: hashedPassword,
                title: body.title,
                first_name: body.first_name,
                last_name: body.last_name,
                email: body.email,
                phone: body.phone ?? null,
                status: body.status || 'active',
                role_id: Number(body.role_id),
            }
        })

        // ── จัดการ teacher record ──────────────────────────────────────────────
        if (Number(body.role_id) === TEACHER_ROLE_ID) {

            // ✅ กรณี 1: admin เลือก teacher_id มาตรงๆ (manual link)
            if (body.teacher_id) {
                const teacher = await prisma.teachers.findUnique({
                    where: { teacher_id: Number(body.teacher_id) }
                })

                if (teacher && !teacher.user_id) {
                    await prisma.teachers.update({
                        where: { teacher_id: Number(body.teacher_id) },
                        data: {
                            user_id: newUser.id,
                            email: body.email,
                            phone: body.phone ?? teacher.phone ?? null,
                        }
                    })
                }
            } else {
                // ✅ กรณี 2: หา teacher ที่ email ตรงกันและยังไม่มี user_id (auto-link)
                const matchedTeacher = await prisma.teachers.findFirst({
                    where: { email: body.email, user_id: null }
                })

                if (matchedTeacher) {
                    await prisma.teachers.update({
                        where: { teacher_id: matchedTeacher.teacher_id },
                        data: {
                            user_id: newUser.id,
                            phone: body.phone ?? matchedTeacher.phone ?? null,
                        }
                    })
                } else {
                    // ✅ กรณี 3: ไม่มี teacher เดิม → สร้างใหม่
                    await prisma.teachers.create({
                        data: {
                            user_id: newUser.id,
                            employee_code: body.employee_code || `EMP${newUser.id}`,
                            title_name: body.title,
                            first_name_th: body.first_name,
                            last_name_th: body.last_name,
                            email: body.email,
                            phone: body.phone ?? null,
                            department_id: body.department_id ? Number(body.department_id) : null,
                        }
                    })
                }
            }
        }

        return newUser
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const updateUser = async ({ params, body, set }) => {
    try {
        const existEmail = await prisma.users.findFirst({
            where: { email: body.email, NOT: { id: Number(params.id) } }
        })
        if (existEmail) { set.status = 400; return { error: 'อีเมลนี้ถูกใช้งานแล้ว' } }

        const updatedUser = await prisma.users.update({
            where: { id: Number(params.id) },
            data: {
                title: body.title,
                first_name: body.first_name,
                last_name: body.last_name,
                email: body.email,
                phone: body.phone ?? null,
                status: body.status,
                role_id: body.role_id,
                updated_at: new Date()
            }
        })

        await prisma.teachers.updateMany({
            where: { user_id: updatedUser.id },
            data: {
                title_name: body.title,
                first_name_th: body.first_name,
                last_name_th: body.last_name,
                email: body.email,
                phone: body.phone ?? null,
                updated_at: new Date()
            }
        })

        return updatedUser
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const deleteUser = async ({ params, store, set }) => {
    try {
        const user = store.user
        if (user.id === Number(params.id)) {
            set.status = 400
            return { error: 'ไม่สามารถลบบัญชีตัวเองได้' }
        }
        await prisma.users.delete({ where: { id: Number(params.id) } })
        return { message: 'ลบสำเร็จ' }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}

export const resetPassword = async ({ params, set }) => {
    try {
        const defaultPassword = 'RMU@1234'
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)
        await prisma.users.update({
            where: { id: Number(params.id) },
            data: { password_hash: hashedPassword }
        })
        return { message: 'รีเซ็ตรหัสผ่านสำเร็จ' }
    } catch (err) {
        set.status = 500
        return { error: err.message }
    }
}
