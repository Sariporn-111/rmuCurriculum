import { Elysia, t } from "elysia";
import {
    getSmo08List,
    getSmo08ById,
    createSmo08,
    updateSmo08,
    updateSmo08Academic,
    deleteSmo08,
} from "../controllers/smo08Controller.js";
import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

export const smo08Route = new Elysia({ prefix: "/smo08" })

    // ── ดึงรายการ (ทุก role ดูได้) ──────────────────────────────────────────
    .get("/", getSmo08List, {
        beforeHandle: [isAuth],
    })

    .get("/:id", getSmo08ById, {
        beforeHandle: [isAuth],
    })

    // ── เจ้าหน้าที่: เลือกหลักสูตร + อัปโหลดไฟล์ + หมายเหตุ ──────────────
    .post("/", createSmo08, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            curriculum_id: t.String(),
            note: t.Optional(t.String()),
            file: t.Optional(t.File()),
        }),
    })

    .put("/:id", updateSmo08, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
        body: t.Object({
            curriculum_id: t.String(),
            note: t.Optional(t.String()),
            file: t.Optional(t.File()),
        }),
    })

    // ── อาจารย์: กรอกข้อมูลวิชาการ (ไม่มีไฟล์) ────────────────────────────
    .put("/:id/academic", updateSmo08Academic, {
        beforeHandle: [isAuth, allowRoles(["teacher"])],
        body: t.Object({
            improve_round: t.Optional(t.String()),
            year: t.Optional(t.String()),
            approve_date: t.Optional(t.String()),
            start_term: t.Optional(t.String()),
            start_year: t.Optional(t.String()),
            reason: t.Optional(t.String()),
            old_structure: t.Optional(t.String()),
            new_structure: t.Optional(t.String()),
        }),
    })

    // ── เจ้าหน้าที่: ลบ ──────────────────────────────────────────────────────
    .delete("/:id", deleteSmo08, {
        beforeHandle: [isAuth, allowRoles(["officer"])],
    });