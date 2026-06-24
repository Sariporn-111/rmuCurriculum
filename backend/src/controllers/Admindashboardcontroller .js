import prisma from '../config/prisma.js'

export const getAdminDashboard = async ({ set }) => {
    try {
        const now = new Date()
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

        // จำนวน users ทั้งหมดแยก role
        const usersByRole = await prisma.users.groupBy({
            by: ['role_id'],
            _count: { id: true }
        })

        // ดึง role names
        const roles = await prisma.roles.findMany()
        const roleMap = Object.fromEntries(roles.map(r => [r.role_id, r.role_name]))

        const userRoleStats = usersByRole.map(r => ({
            role: roleMap[r.role_id] || 'unknown',
            count: r._count.id
        }))

        // จำนวน active / inactive
        const activeCount = await prisma.users.count({ where: { status: 'active' } })
        const inactiveCount = await prisma.users.count({ where: { status: 'inactive' } })
        const totalUsers = activeCount + inactiveCount

        // users ที่ active ล่าสุด 7 วัน
        const recentlyActive = await prisma.users.count({
            where: {
                status: 'active',
                updated_at: { gte: sevenDaysAgo }
            }
        })

        // users ที่สมัครล่าสุด 5 คน
        const latestUsers = await prisma.users.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                first_name: true,
                last_name: true,
                email: true,
                status: true,
                created_at: true,
                roles: {
                    select: { role_name: true }
                }
            }
        })
        // จำนวนหลักสูตรทั้งหมด
        const totalCurriculums = await prisma.tb_curriculum.count()

        // จำนวนหลักสูตรแยกตามคณะ
        const curriculumByFaculty = await prisma.tb_curriculum.groupBy({
            by: ['department_id'],
            _count: { curriculum_id: true }
        })

        const departments = await prisma.departments.findMany({
            include: { faculties: { select: { faculty_name_th: true } } }
        })

        const deptMap = Object.fromEntries(
            departments.map(d => [d.id, {
                dept: d.department_name_th,
                faculty: d.faculties?.faculty_name_th || '-'
            }])
        )

        const curriculumStats = curriculumByFaculty.map(c => ({
            department: deptMap[c.department_id]?.dept || 'ไม่ระบุ',
            faculty: deptMap[c.department_id]?.faculty || 'ไม่ระบุ',
            count: c._count.curriculum_id
        }))

        // จำนวนเอกสารรับรองแยกตามสถานะ
        const certByStatus = await prisma.curriculum_certification.groupBy({
            by: ['status'],
            _count: { certification_id: true }
        })

        const certStats = certByStatus.map(c => ({
            status: c.status,
            count: c._count.certification_id
        }))

        // จำนวนกรรมการวิชาการ
        const totalAcademicCommittee = await prisma.academic_committee.count({
            where: { is_active: true }
        })

        return {
            data: {
                users: {
                    total: totalUsers,
                    active: activeCount,
                    inactive: inactiveCount,
                    recently_active: recentlyActive,
                    by_role: userRoleStats,
                    latest: latestUsers.map(u => ({
                        ...u,
                        role_name: u.roles?.role_name || '-'
                    }))
                },
                curriculums: {
                    total: totalCurriculums,
                    by_faculty: curriculumStats
                },
                certifications: {
                    by_status: certStats
                },
                academic_committee: {
                    total: totalAcademicCommittee
                }
            }
        }

    } catch (err) {
        console.log("DASHBOARD ERROR:", err.message) // ✅ เพิ่มบรรทัดนี้
        set.status = 500
        return { error: err.message }
    }
}