import { Elysia } from 'elysia'
import {
    getMeetingsByCurriculum,
    addMeeting,
    updateMeeting,
    deleteMeeting,
} from '../controllers/meetingController.js'
import { isAuth } from '../middleware/authMiddleware.js'

export const meetingRoute = new Elysia()
    // ✅ แก้: handler ต้องมาก่อน, options (beforeHandle) ต้องเป็น argument ที่ 3
    .get('/courses/:id/meetings', getMeetingsByCurriculum, { beforeHandle: isAuth })
    .post('/courses/:id/meetings', addMeeting, { beforeHandle: isAuth })
    .put('/courses/:id/meetings/:approvalId', updateMeeting, { beforeHandle: isAuth })
    .delete('/courses/:id/meetings/:approvalId', deleteMeeting, { beforeHandle: isAuth })