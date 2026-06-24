import { Elysia, t } from "elysia";
import {
    getFaculties,
    getDepartmentsByFaculty,
    getAllDepartments,
    createFaculty,
    createDepartment,
} from "../controllers/facultyController.js";
import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

export const facultyRoute = new Elysia({ prefix: "/faculties" })

    .get("/", getFaculties, {
        beforeHandle: [isAuth],
    })

    .get("/departments", getAllDepartments, {
        beforeHandle: [isAuth],
    })

    .get("/:facultyId/departments", getDepartmentsByFaculty, {
        beforeHandle: [isAuth],
    })

    .post("/", createFaculty, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            faculty_name_th: t.String(),
            faculty_name_en: t.Optional(t.String()),
        })
    })

    .post("/departments", createDepartment, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            faculty_id: t.Number(),
            department_name_th: t.String(),
            department_name_en: t.Optional(t.String()),
        })
    })