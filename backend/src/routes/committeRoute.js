import { Elysia, t } from 'elysia'
import { isAuth } from '../middleware/authMiddleware'
import { allowRoles } from '../middleware/roleMiddleware'
import { createTeacher, deleteTeacher, getMyEducation, getMyProfile, getTeachers, updateMyEducation, updateMyProfile, updateTeacher, uploadProfileImage } from '../controllers/teachersController'
import { addCommitteeMany, deleteCommittee, getCommittee, updateCommittee } from '../controllers/committeeController'

export const committeeRoute = new Elysia()
    // ✅ Teacher profile (สำหรับอาจารย์จัดการข้อมูลตัวเอง)
    .get('/teachers/me', getMyProfile, {
        beforeHandle: [isAuth]
    })
    .put('/teachers/me', updateMyProfile, {
        beforeHandle: [isAuth]
    })
    .post('/teachers/me/image', uploadProfileImage, {
        beforeHandle: [isAuth],
        body: t.Object({
            file: t.File()
        })
    })
    // Teachers
    .get('/teachers', getTeachers, {
        beforeHandle: [isAuth]
    })
    .post('/teachers', createTeacher, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })
    // ✅ ต้องอยู่ก่อน /teachers/:id เสมอ
    .get('/teachers/me/education', getMyEducation, {
        beforeHandle: [isAuth]
    })
    .put('/teachers/me/education', updateMyEducation, {
        beforeHandle: [isAuth]
    })
    .put('/teachers/:id', updateTeacher, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })
    .delete('/teachers/:id', deleteTeacher, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })
    // Committee
    .get('/courses/:id/committee', getCommittee, {
        beforeHandle: [isAuth]
    })
    .post('/committee/bulk', addCommitteeMany, {
        beforeHandle: [isAuth, allowRoles(['officer'])],
        body: t.Object({
            course_id: t.Union([t.Number(), t.String()]),
            committees: t.Array(t.Object({
                teacher_id: t.Union([t.Number(), t.String()]),
                committee_role: t.String(),
                responsibility: t.Optional(t.String()),
                appointed_date: t.Optional(t.String()),
            }))
        })
    })
    .put('/committee/:id', updateCommittee, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })
    .delete('/committee/:id', deleteCommittee, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })