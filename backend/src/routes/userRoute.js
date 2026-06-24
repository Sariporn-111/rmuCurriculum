import { Elysia } from "elysia";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    getUnlinkedTeachers
} from "../controllers/userController.js";

import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { getAdminDashboard } from "../controllers/Admindashboardcontroller .js";

export const userRoute = new Elysia({ prefix: "/users" })
    .get("/dashboard", getAdminDashboard, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    .get("", getUsers, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    .post("", createUser, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    // ✅ ต้องอยู่ก่อน /:id และไม่ต้องใส่ /users/ นำหน้า
    .get("/unlinked-teachers", getUnlinkedTeachers, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    .put("/:id", updateUser, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    .delete("/:id", deleteUser, {
        beforeHandle: [isAuth, allowRoles(["admin"])]
    })
    .post("/:id/reset-password", resetPassword)