import prisma from '../config/prisma.js'

export const getOfficerDashboard = async ({ set }) => {
    try {
        // จำนวนหลักสูตรทั้งหมด
        const totalCurriculums = await prisma.tb_curriculum.count()

        // หลักสูตรแยกตามปี
        const curriculumByYear = await prisma.tb_curriculum.groupBy({
            by: ['curriculum_year'],
            _count: { curriculum_id: true },
            orderBy: { curriculum_year: 'asc' }
        })

        // // จำนวนเอกสารรับรองแยกตามสถานะ
        // const certByStatus = await prisma.curriculum_certification.groupBy({
        //     by: ['status'],
        //     _count: { certification_id: true }
        // })

        // const totalCerts = certByStatus.reduce((sum, c) => sum + c._count.certification_id, 0)
        // const approvedCerts = certByStatus.find(c => c.status === 'approved')?._count.certification_id || 0
        // const pendingCerts = certByStatus.find(c => c.status === 'pending')?._count.certification_id || 0
        // const rejectedCerts = certByStatus.find(c => c.status === 'rejected')?._count.certification_id || 0

        // จำนวน สมอ.08
        const totalSmo08 = await prisma.smo08.count()

        // จำนวนกรรมการหลักสูตรทั้งหมด (unique teacher)
        const totalCommittee = await prisma.curriculum_committee.count()

        // หลักสูตรล่าสุด 5 รายการ
        const latestCurriculums = await prisma.tb_curriculum.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: {
                departments: {
                    include: { faculties: true }
                }
            }
        })

        // หลักสูตรแยกตามคณะ
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

        const facultyStats = curriculumByFaculty.map(c => ({
            faculty: deptMap[c.department_id]?.faculty || 'ไม่ระบุ',
            department: deptMap[c.department_id]?.dept || 'ไม่ระบุ',
            count: c._count.curriculum_id
        }))

        return {
            data: {
                stats: {
                    total_curriculums: totalCurriculums,
                    total_smo08: totalSmo08,
                    total_committee: totalCommittee,

                },
                curriculum_by_year: curriculumByYear.map(c => ({
                    year: c.curriculum_year,
                    count: c._count.curriculum_id
                })),
                curriculum_by_faculty: facultyStats,
                latest_curriculums: latestCurriculums.map(c => ({
                    curriculum_id: c.curriculum_id,
                    curriculum_name_th: c.curriculum_name_th,
                    curriculum_year: c.curriculum_year,
                    faculty: c.departments?.faculties?.faculty_name_th || '-',
                    department: c.departments?.department_name_th || '-',
                    created_at: c.created_at,
                }))
            }
        }

    } catch (err) {
        console.log("OFFICER DASHBOARD ERROR:", err.message)
        set.status = 500
        return { error: err.message }
    }
}