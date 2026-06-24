// routes/roleRoute.js
import { Elysia } from "elysia";
import { getRoles } from "../controllers/roleController.js";

export const roleRoute = new Elysia({ prefix: "/roles" })
    .get("/", getRoles);