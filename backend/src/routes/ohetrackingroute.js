// src/routes/oheTrackingRoute.js
import { Elysia } from 'elysia'
import {
    getOheTrackingByCurriculum,
    getLatestOheTracking,
    createOheTracking,
    updateOheTracking,
    deleteOheTracking,
} from '../controllers/OheTrackingController.js'
import { isAuth } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'

export const oheTrackingRoute = new Elysia({ prefix: '/ohe-tracking' })

    // GET ประวัติทั้งหมดของหลักสูตร
    .get('/curriculum/:curriculumId', getOheTrackingByCurriculum, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET สถานะล่าสุดของหลักสูตร
    .get('/curriculum/:curriculumId/latest', getLatestOheTracking, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // POST บันทึกสถานะใหม่
    .post('/', createOheTracking, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    // PUT แก้ไขสถานะ
    .put('/:id', updateOheTracking, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    // DELETE ลบสถานะ
    .delete('/:id', deleteOheTracking, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })