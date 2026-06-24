import prisma from '../config/prisma.js'

export const getCommittee = async ({ params }) => {
    return await prisma.curriculum_committee.findMany({
        where: { course_id: Number(params.id), is_active: true },
        include: {
            teachers: {
                select: {
                    teacher_id: true,
                    title_name: true,
                    first_name_th: true,
                    last_name_th: true,
                    academic_position: true,
                    highest_degree: true,
                    major_degree: true,
                }
            }
        },
        orderBy: { committee_id: 'asc' }
    })
}

// export const addCommitteeMany = async ({ body }) => {
//     try {
//         // body.committees = [{ teacher_id, committee_role, responsibility, appointed_date }, ...]
//         console.log("=== BODY RECEIVED ===", JSON.stringify(body, null, 2)) // ← เพิ่มบรรทัดนี้
//         const data = body.committees.map((c) => ({
//             course_id: Number(body.course_id),
//             teacher_id: Number(c.teacher_id),
//             committee_role: c.committee_role,
//             responsibility: c.responsibility || 'member',
//             appointed_date: c.appointed_date ? new Date(c.appointed_date) : null,
//         }))

//         const result = await prisma.curriculum_committee.createMany({ data })
//         console.log("BODY:", body);
//         console.log("COMMITTEES:", body.committees);
//         return { message: 'เพิ่มกรรมการสำเร็จ', count: result.count }

//     } catch (err) {
//         console.log("=== PRISMA ERROR ===", err)
//         return { error: err.message }
//     }
// }
export const addCommitteeMany = async ({ body, set }) => {
    try {

        // =========================
        // แปลงข้อมูล
        // =========================
        const data = body.committees.map((c) => ({
            course_id: Number(body.course_id),
            teacher_id: Number(c.teacher_id),
            committee_role: c.committee_role,
            responsibility: c.responsibility || 'member',
            appointed_date: c.appointed_date
                ? new Date(c.appointed_date)
                : null,
        }))

        // =========================
        // เช็คซ้ำในหลักสูตรเดียวกัน
        // =========================
        for (const item of data) {

            const duplicate = await prisma.curriculum_committee.findFirst({
                where: {
                    course_id: item.course_id,
                    teacher_id: item.teacher_id,
                },
                include: {
                    teachers: true,
                    tb_curriculum: true
                }
            })

            if (duplicate) {

                set.status = 400

                return {
                    error:
                        `อาจารย์ ${duplicate.teachers.title_name}${duplicate.teachers.first_name_th} ${duplicate.teachers.last_name_th}
อยู่ในหลักสูตร ${duplicate.tb_curriculum.curriculum_name_th}
แล้ว`
                }
            }
        }

        // =========================
        // เช็คผู้รับผิดชอบหลักสูตร
        // =========================
        for (const item of data) {

            if (item.responsibility === 'responsible') {

                const responsibleTeacher =
                    await prisma.curriculum_committee.findFirst({
                        where: {
                            teacher_id: item.teacher_id,
                            responsibility: 'responsible',
                            course_id: { not: item.course_id }
                        },
                        include: {
                            tb_curriculum: true,
                            teachers: true
                        }
                    })

                if (responsibleTeacher) {

                    set.status = 400

                    return {
                        error:
                            `อาจารย์ ${responsibleTeacher.teachers.title_name}${responsibleTeacher.teachers.first_name_th} ${responsibleTeacher.teachers.last_name_th}
เป็นผู้รับผิดชอบหลักสูตร
${responsibleTeacher.tb_curriculum.curriculum_name_th}
อยู่แล้ว`
                    }
                }
            }
        }

        // =========================
        // เพิ่มข้อมูล
        // =========================
        const result =
            await prisma.curriculum_committee.createMany({
                data
            })

        return {
            message: 'เพิ่มกรรมการสำเร็จ',
            count: result.count
        }

    } catch (err) {

        console.log(err)

        set.status = 500

        return {
            error: err.message
        }
    }
}

export const updateCommittee = async ({ params, body }) => {
    try {
        return await prisma.curriculum_committee.update({
            where: { committee_id: Number(params.id) },
            data: {
                committee_role: body.committee_role,
                responsibility: body.responsibility,
                appointed_date: body.appointed_date ? new Date(body.appointed_date) : null,
            }
        })
    } catch (err) {
        return { error: err.message }
    }
}

export const deleteCommittee = async ({ params }) => {
    try {
        await prisma.curriculum_committee.delete({
            where: { committee_id: Number(params.id) }
        })
        return { message: 'ลบสำเร็จ' }
    } catch (err) {
        return { error: err.message }
    }
}