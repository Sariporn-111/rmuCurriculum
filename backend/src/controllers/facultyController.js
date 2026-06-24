import prisma from "../config/prisma.js";

// ดึงคณะทั้งหมด
export const getFaculties = async () => {
    try {
        const result = await prisma.faculties.findMany({
            orderBy: { id: "asc" },
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// ดึงสาขาตาม faculty_id
export const getDepartmentsByFaculty = async ({ params }) => {
    try {
        const result = await prisma.departments.findMany({
            where: { faculty_id: Number(params.facultyId) },
            orderBy: { id: "asc" },
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// ดึงสาขาทั้งหมด
export const getAllDepartments = async () => {
    try {
        const result = await prisma.departments.findMany({
            include: { faculties: true },
            orderBy: { id: "asc" },
        });
        return { data: result };
    } catch (err) {
        return { error: err.message };
    }
};

// เพิ่มคณะใหม่
export const createFaculty = async ({ body, set }) => {
    try {
        const result = await prisma.faculties.create({
            data: {
                faculty_name_th: body.faculty_name_th,
                faculty_name_en: body.faculty_name_en || "",
            }
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};

// เพิ่มสาขาใหม่
export const createDepartment = async ({ body, set }) => {
    try {
        const result = await prisma.departments.create({
            data: {
                faculty_id: Number(body.faculty_id),
                department_name_th: body.department_name_th,
                department_name_en: body.department_name_en || "",
            }
        });
        return { data: result };
    } catch (err) {
        set.status = 500;
        return { error: err.message };
    }
};