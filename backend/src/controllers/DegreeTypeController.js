import prisma from "../config/prisma.js";

// GET /degree-types?level=bachelor
export const getDegreeTypes = async ({ query }) => {
    try {
        const { level } = query || {};
        const result = await prisma.degree_types.findMany({
            where: {
                is_active: true,
                ...(level ? { education_level: level } : {})
            },
            orderBy: [
                { education_level: "asc" },
                { sort_order: "asc" }
            ]
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// GET /degree-types/all (admin — ดูทั้งหมดรวม inactive)
export const getAllDegreeTypes = async () => {
    try {
        const result = await prisma.degree_types.findMany({
            orderBy: [
                { education_level: "asc" },
                { sort_order: "asc" }
            ]
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// POST /degree-types
export const createDegreeType = async ({ body, set }) => {
    try {
        if (!body.name_th || !body.education_level) {
            set.status = 400;
            return { error: "กรุณากรอกชื่อปริญญาและระดับการศึกษา" };
        }

        const result = await prisma.degree_types.create({
            data: {
                education_level: body.education_level,
                name_th: body.name_th,
                name_en: body.name_en || null,
                abbr_th: body.abbr_th || null,
                abbr_en: body.abbr_en || null,
                sort_order: Number(body.sort_order) || 0,
                is_active: true,
            }
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// PUT /degree-types/:id
export const updateDegreeType = async ({ params, body, set }) => {
    try {
        const result = await prisma.degree_types.update({
            where: { id: Number(params.id) },
            data: {
                education_level: body.education_level,
                name_th: body.name_th,
                name_en: body.name_en || null,
                abbr_th: body.abbr_th || null,
                abbr_en: body.abbr_en || null,
                sort_order: Number(body.sort_order) || 0,
                is_active: body.is_active ?? true,
            }
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// DELETE /degree-types/:id (soft delete)
export const deleteDegreeType = async ({ params, set }) => {
    try {
        await prisma.degree_types.update({
            where: { id: Number(params.id) },
            data: { is_active: false }
        });
        return { message: "ลบสำเร็จ" };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};