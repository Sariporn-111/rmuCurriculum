import prisma from "../config/prisma.js";

// ดึงทั้งหมด + รองรับ search
export const getAcademicCommittees = async ({ query }) => {
    try {
        const { search, role } = query || {};

        const result = await prisma.academic_committee.findMany({
            where: {
                AND: [
                    search
                        ? {
                            teachers: {
                                OR: [
                                    { first_name_th: { contains: search, mode: "insensitive" } },
                                    { last_name_th: { contains: search, mode: "insensitive" } },
                                ],
                            },
                        }
                        : {},
                    role ? { role: { contains: role, mode: "insensitive" } } : {},
                ],
            },
            include: {
                teachers: {
                    select: {
                        teacher_id: true,
                        title_name: true,
                        first_name_th: true,
                        last_name_th: true,
                        academic_position: true,
                        profile_image: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { id: "asc" },
        });

        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

export const createAcademicCommittee = async ({ body, set }) => {
    try {
        const result = await prisma.academic_committee.create({
            data: {
                teacher_id: Number(body.teacher_id),
                role: body.role,
                duty: body.duty || null,
                appointed_date: body.appointed_date ? new Date(body.appointed_date) : null,
                end_date: body.end_date ? new Date(body.end_date) : null,
                is_active: body.is_active ?? true,
            },
            include: {
                teachers: {
                    select: {
                        teacher_id: true,
                        title_name: true,
                        first_name_th: true,
                        last_name_th: true,
                        academic_position: true,
                        profile_image: true,
                    },
                },
            },
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const updateAcademicCommittee = async ({ params, body, set }) => {
    try {
        const result = await prisma.academic_committee.update({
            where: { id: Number(params.id) },
            data: {
                teacher_id: Number(body.teacher_id),
                role: body.role,
                duty: body.duty || null,
                appointed_date: body.appointed_date ? new Date(body.appointed_date) : null,
                end_date: body.end_date ? new Date(body.end_date) : null,
                is_active: body.is_active ?? true,
            },
            include: {
                teachers: {
                    select: {
                        teacher_id: true,
                        title_name: true,
                        first_name_th: true,
                        last_name_th: true,
                        academic_position: true,
                        profile_image: true,
                    },
                },
            },
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

export const deleteAcademicCommittee = async ({ params, set }) => {
    try {
        await prisma.academic_committee.delete({
            where: { id: Number(params.id) },
        });
        return { message: "ลบสำเร็จ" };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};