import { Elysia } from "elysia";
import { getOfficerDashboard } from "../controllers/Officerdashboardcontroller.js";
import { isAuth } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

export const officerDashboardRoute = new Elysia({ prefix: "/officer" })
    .get("/dashboard", getOfficerDashboard, {
        beforeHandle: [isAuth, allowRoles(["officer"])]
    });