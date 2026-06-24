// src/utils/reportExport.js
import api from '../services/api'

const downloadFile = async (url, params = {}, filename) => {
    const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v && v !== 'all' && v !== 'ทั้งหมด')
    )

    const query = new URLSearchParams(cleanParams).toString()
    const fullUrl = query ? `${url}?${query}` : url

    const response = await api.get(fullUrl, { responseType: 'blob' })

    const blob = new Blob([response.data], { type: response.headers['content-type'] })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
}

// ── รายงานหลักสูตร ────────────────────────────────────────────────────────────
export const exportCurriculumExcel = (filters = {}) =>
    downloadFile('/reports/curriculum/excel', filters, 'รายงานข้อมูลหลักสูตร.xlsx')

export const exportCurriculumPDF = (filters = {}) =>
    downloadFile('/reports/curriculum/pdf', filters, 'รายงานข้อมูลหลักสูตร.pdf')

// ── รายงานอาจารย์ประจำหลักสูตร (เดิม) ─────────────────────────────────────────
export const exportTeachersExcel = (filters = {}) =>
    downloadFile('/reports/teachers/excel', filters, 'รายงานข้อมูลอาจารย์ประจำหลักสูตร.xlsx')

export const exportTeachersPDF = (filters = {}) =>
    downloadFile('/reports/teachers/pdf', filters, 'รายงานข้อมูลอาจารย์ประจำหลักสูตร.pdf')

// ── ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร (ใหม่) ────────────────────────
export const exportResponsibleExcel = (filters = {}) =>
    downloadFile('/reports/responsible/excel', filters, 'รายงานผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร.xlsx')

export const exportResponsiblePDF = (filters = {}) =>
    downloadFile('/reports/responsible/pdf', filters, 'รายงานผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร.pdf')