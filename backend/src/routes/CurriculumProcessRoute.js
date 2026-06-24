// src/routes/CurriculumProcessRoute.js
import { Elysia } from 'elysia'
import {
    updateProcessStatus,
    uploadProcessFile,
    deleteProcessFile,
} from '../controllers/CurriculumProcessController.js'
import { isAuth } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'

export const curriculumProcessRoute = new Elysia({ prefix: '/curriculum-process' })

    // อัปเดตสถานะขั้นตอน (เดิม)
    .put('/:id', updateProcessStatus, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    // ✅ อัปโหลดไฟล์แนบใน step
    .post('/:id/upload', uploadProcessFile, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    // ✅ ลบไฟล์แนบใน step
    .delete('/:id/file', deleteProcessFile, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })