import { Elysia, t } from "elysia";
import {
    getAcademicCommittees,
    createAcademicCommittee,
    updateAcademicCommittee,
    deleteAcademicCommittee,
} from "../controllers/academicCommitteeController.js";
import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

export const academicCommitteeRoute = new Elysia({ prefix: "/academic-committee" })

    .get("/", getAcademicCommittees, {
        beforeHandle: [isAuth],
    })

    .post("/", createAcademicCommittee, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            teacher_id: t.Union([t.Number(), t.String()]),
            role: t.String(),
            duty: t.Optional(t.String()),
            appointed_date: t.Optional(t.String()),
            end_date: t.Optional(t.String()),
            is_active: t.Optional(t.Boolean()),
        }),
    })

    .put("/:id", updateAcademicCommittee, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            teacher_id: t.Union([t.Number(), t.String()]),
            role: t.String(),
            duty: t.Optional(t.String()),
            appointed_date: t.Optional(t.String()),
            end_date: t.Optional(t.String()),
            is_active: t.Optional(t.Boolean()),
        }),
    })

    .delete("/:id", deleteAcademicCommittee, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
    });