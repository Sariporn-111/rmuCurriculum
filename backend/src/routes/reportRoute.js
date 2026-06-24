// src/routes/reportRoute.js
import { Elysia } from 'elysia'
import {
    exportCurriculumExcel,
    exportCurriculumPDF,
    exportTeachersExcel,
    exportTeachersPDF,
    exportResponsibleExcel,
    exportResponsiblePDF,
} from '../controllers/reportController.js'
import { isAuth } from '../middleware/authMiddleware.js'
import { allowRoles } from '../middleware/roleMiddleware.js'

export const reportRoute = new Elysia({ prefix: '/reports' })

    // GET /reports/curriculum/excel?year=2567&faculty_id=1&education_level=bachelor
    .get('/curriculum/excel', exportCurriculumExcel, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET /reports/curriculum/pdf?year=2567&faculty_id=1&education_level=bachelor
    .get('/curriculum/pdf', exportCurriculumPDF, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET /reports/teachers/excel — รายงานอาจารย์ประจำหลักสูตร (เดิม)
    .get('/teachers/excel', exportTeachersExcel, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET /reports/teachers/pdf — รายงานอาจารย์ประจำหลักสูตร (เดิม)
    .get('/teachers/pdf', exportTeachersPDF, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET /reports/responsible/excel — ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร (ใหม่)
    .get('/responsible/excel', exportResponsibleExcel, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })

    // GET /reports/responsible/pdf — ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร (ใหม่)
    .get('/responsible/pdf', exportResponsiblePDF, {
        beforeHandle: [isAuth, allowRoles(['officer', 'teacher'])]
    })