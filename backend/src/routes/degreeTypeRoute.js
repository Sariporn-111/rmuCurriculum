import { Elysia } from "elysia";
import {
    getDegreeTypes,
    getAllDegreeTypes,
    createDegreeType,
    updateDegreeType,
    deleteDegreeType,
} from "../controllers/DegreeTypeController.js";
import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

export const degreeTypeRoute = new Elysia({ prefix: "/degree-types" })

    // ทุก role ดูได้ (ใช้ใน CourseModal)
    .get("/", getDegreeTypes, { beforeHandle: [isAuth] })

    // admin/officer เท่านั้นจัดการได้
    .get("/all", getAllDegreeTypes, { beforeHandle: [isAuth, allowRoles(["officer"])] })
    .post("/", createDegreeType, { beforeHandle: [isAuth, allowRoles(["officer"])] })
    .put("/:id", updateDegreeType, { beforeHandle: [isAuth, allowRoles(["officer"])] })
    .delete("/:id", deleteDegreeType, { beforeHandle: [isAuth, allowRoles(["officer"])] });