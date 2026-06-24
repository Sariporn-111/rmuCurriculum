import { Elysia } from 'elysia'
import {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,

} from '../controllers/CurriculumController.js'

import { isAuth } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'

export const courseRoute = new Elysia({ prefix: '/courses' })

    // 🔓 login ทุก role
    .get('/', getCourses, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    .get('/:id', getCourseById, {
        beforeHandle: [isAuth]
    })

    // 👑 admin + officer
    .post('/', createCourse, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    .put('/:id', updateCourse, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })

    // 👑 admin เท่านั้น
    .delete('/:id', deleteCourse, {
        beforeHandle: [isAuth, allowRoles(['officer'])]
    })
// .post('/:id/generate-processes', generateProcesses, {
//     beforeHandle: [isAuth, allowRoles(['officer'])]
// })