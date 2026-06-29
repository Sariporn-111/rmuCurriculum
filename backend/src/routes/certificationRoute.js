import { Elysia, t } from "elysia";
import {
    getCertifications,
    createCertification,
    updateCertification,
    deleteCertification
} from "../controllers/certificationController";

import { isAuth } from "../middleware/authMiddleware";
import { allowRoles } from "../middleware/roleMiddleware";

export const certificationRoute = new Elysia({ prefix: "/certifications" })

    .get("/", getCertifications, {
        beforeHandle: [isAuth]
    })

    .post("/", createCertification, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            curriculum_id: t.String(),
            certification_type: t.String(),
            agency: t.String(),
            recipient: t.Optional(t.String()),   // ✅ เพิ่ม
            doc_number: t.Optional(t.String()),
            issue_date: t.Optional(t.String()),
            received_date: t.Optional(t.String()),
            received_time: t.Optional(t.String()),   // ✅ เพิ่ม
            request_date: t.Optional(t.String()),
            approve_date: t.Optional(t.String()),
            note: t.Optional(t.String()),
            file: t.Optional(t.File()),
        })
    })

    .put("/:id", updateCertification, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            curriculum_id: t.String(),
            certification_type: t.String(),
            agency: t.String(),
            recipient: t.Optional(t.String()),
            doc_number: t.Optional(t.String()),
            issue_date: t.Optional(t.String()),
            received_date: t.Optional(t.String()),
            received_time: t.Optional(t.String()),
            request_date: t.Optional(t.String()),
            approve_date: t.Optional(t.String()),
            note: t.Optional(t.String()),
            status: t.Optional(t.String()),
            file: t.Optional(t.File()),
        })
    })

    .put("/:id", updateCertification, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            curriculum_id: t.String(),
            certification_type: t.String(),
            agency: t.String(),
            recipient: t.Optional(t.String()),
            received_date: t.Optional(t.String()),
            received_time: t.Optional(t.String()),
            request_date: t.Optional(t.String()),
            approve_date: t.Optional(t.String()),
            note: t.Optional(t.String()),
            status: t.Optional(t.String()),
            file: t.Optional(t.File()),
        })
    })

    .delete("/:id", deleteCertification, {
        beforeHandle: [isAuth, allowRoles(["officer"])]
    });