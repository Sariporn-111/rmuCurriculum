// src/controllers/ReportController.js
import prisma from '../config/prisma.js'
import ExcelJS from 'exceljs'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── ขนาดฟอนต์เนื้อหามาตรฐานของทุกรายงาน (หัวข้อรายงาน/ชื่อหน่วยงาน ไม่ใช้ค่านี้) ──
const CONTENT_FONT_SIZE = 16
const LINE_H = 19   // ความสูงบรรทัดที่เหมาะกับ font 16 ใน PDF
const PAD = 8        // padding บน+ล่างของแถวใน PDF

// ─── helpers ─────────────────────────────────────────────────────────────────
const toBE = (val) => (val ? Number(val) + 543 : '-')

const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear() + 543
    return `${day}/${month}/${year}`
}

// ── โหลด font helper ─────────────────────────────────────────────────────────
const loadFonts = async (pdfDoc) => {
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'THSarabunNew.ttf')
    const fontBoldPath = path.join(__dirname, '..', 'assets', 'fonts', 'THSarabunNew Bold.ttf')
    if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath)
        const fontBoldBytes = fs.existsSync(fontBoldPath) ? fs.readFileSync(fontBoldPath) : fontBytes
        return {
            font: await pdfDoc.embedFont(fontBytes),
            fontBold: await pdfDoc.embedFont(fontBoldBytes),
        }
    }
    return {
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        fontBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    }
}

// ── ตัดข้อความขึ้นบรรทัดใหม่ตามความกว้างคอลัมน์ (ใช้ร่วมกันทุกรายงาน PDF) ──
const wrapTextLines = (text, f, fontSize, maxW, maxLines = 3) => {
    const str = String(text ?? '').trim()
    if (!str) return ['']

    const words = str.split(' ')
    const lines = []
    let current = ''

    const breakLongWord = (chars) => {
        let chunk = ''
        for (const ch of chars) {
            const test = chunk + ch
            if (f.widthOfTextAtSize(test, fontSize) > maxW && chunk) {
                lines.push(chunk)
                chunk = ch
            } else {
                chunk = test
            }
        }
        return chunk
    }

    for (const word of words) {
        const test = current ? `${current} ${word}` : word
        if (f.widthOfTextAtSize(test, fontSize) <= maxW) {
            current = test
        } else {
            if (current) lines.push(current)
            current = f.widthOfTextAtSize(word, fontSize) > maxW ? breakLongWord(word) : word
        }
    }
    if (current) lines.push(current)
    if (lines.length === 0) lines.push('')

    if (lines.length > maxLines) {
        let last = lines[maxLines - 1]
        while (last.length > 1 && f.widthOfTextAtSize(last + '...', fontSize) > maxW) {
            last = last.slice(0, -1)
        }
        lines[maxLines - 1] = last + '...'
        lines.length = maxLines
    }
    return lines
}

const fetchCourses = async ({ year, faculty_id, education_level, store }) => {
    const user = store?.user
    const role = user?.roles?.role_name
    let whereClause = {}

    if (role === 'teacher') {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (teacher?.department_id) whereClause.department_id = teacher.department_id
    }
    if (faculty_id && faculty_id !== 'all') {
        whereClause.departments = { faculty_id: Number(faculty_id) }
    }
    if (year && year !== 'all') {
        whereClause.curriculum_year = Number(year)
    }
    if (education_level && education_level !== 'all') {
        whereClause.education_level = education_level
    }

    return prisma.tb_curriculum.findMany({
        where: whereClause,
        orderBy: [
            { departments: { faculties: { faculty_name_th: 'asc' } } },
            { curriculum_id: 'asc' }
        ],
        include: {
            departments: { include: { faculties: true } },
            curriculumOheTrackings: {
                orderBy: { created_at: 'desc' },
                take: 1,
            },
        },
    })
}

const formatProgramType = (c) => {
    const typeLabel = c.program_type === 'new' ? 'ใหม่' : 'ปรับปรุง'
    return `${typeLabel}(พ.ศ. ${c.curriculum_year ?? '-'})`
}

const groupByFaculty = (items, getFacultyName) => {
    // รองรับทั้งแบบเดิม (รับ courses ตรง ๆ) และแบบใหม่ (รับ getter function)
    const getter = getFacultyName ?? (c => c.departments?.faculties?.faculty_name_th)
    const map = new Map()
    for (const c of items) {
        const facultyName = getter(c) ?? 'ไม่ระบุคณะ'
        if (!map.has(facultyName)) map.set(facultyName, [])
        map.get(facultyName).push(c)
    }
    return map
}

const toRows = (courses) => {
    const grouped = groupByFaculty(courses)
    const rows = []
    let seq = 1

    for (const [facultyName, items] of grouped) {
        rows.push({ type: 'faculty', name: facultyName })
        for (const c of items) {
            const ohe = c.curriculumOheTrackings?.[0]
            rows.push({
                type: 'data',
                cells: [
                    String(seq++),
                    c.curriculum_code ?? '-',
                    c.curriculum_name_th ?? '-',
                    formatProgramType(c),
                    String(c.start_use_year ?? '-'),
                    String(c.end_year ?? '-'),
                    formatDate(c.effective_date),
                    ohe?.ohe_status ?? '-',
                    c.program_flag ?? '-',
                ]
            })
        }
    }
    return rows
}

// ══════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT — รายงานหลักสูตร  (เนื้อหา font 16)
// ══════════════════════════════════════════════════════════════════════════════
export const exportCurriculumExcel = async ({ query, set, store }) => {
    try {
        const courses = await fetchCourses({ ...query, store })
        const rows = toRows(courses)

        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('รายงานหลักสูตร')

        ws.pageSetup.orientation = 'landscape'
        ws.pageSetup.paperSize = 9
        ws.pageSetup.fitToPage = true
        ws.pageSetup.fitToWidth = 1

        // ขยายความกว้างคอลัมน์เล็กน้อยเพื่อรองรับฟอนต์ 16
        ws.columns = [
            { width: 6 },
            { width: 20 },
            { width: 52 },
            { width: 24 },
            { width: 10 },
            { width: 10 },
            { width: 16 },
            { width: 10 },
            { width: 13 },
        ]

        const fontTH = 'TH Sarabun New'
        const centerW = { horizontal: 'center', vertical: 'middle', wrapText: true }
        const leftW = { horizontal: 'left', vertical: 'middle', wrapText: true }
        const thin = { style: 'thin' }
        const border = { top: thin, bottom: thin, left: thin, right: thin }

        // ── หัวข้อรายงาน (ไม่เปลี่ยนขนาด) ──
        const addTitle = (text, size = 14, bold = true) => {
            const row = ws.addRow([text])
            ws.mergeCells(`A${row.number}:I${row.number}`)
            row.getCell(1).font = { name: fontTH, size, bold }
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
            row.height = size + 8
        }

        const levelLabel = eduLevelTitle(query.education_level)
        addTitle(`รายงานหลักสูตร${levelLabel ? ` ${levelLabel}` : ''}`, 14)
        addTitle('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', 14)
        ws.addRow([])

        // ── Header ตาราง (เนื้อหา → 16) ──
        const HEADERS = ['ที่', 'รหัสหลักสูตร', 'ชื่อหลักสูตร', 'หลักสูตร/ปีที่ใช้', 'พ.ศ.\nเริ่ม', 'สิ้นสุด', 'วันที่รับรอง', 'ครั้งที่', 'หน่วยงาน']
        const hRow = ws.addRow(HEADERS)
        hRow.height = 46
        hRow.eachCell(cell => {
            cell.font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
            cell.alignment = centerW
            cell.border = border
        })

        // ── Data rows (with faculty header rows) ──
        let dataCount = 0
        rows.forEach(r => {
            if (r.type === 'faculty') {
                const fRow = ws.addRow([r.name])
                ws.mergeCells(`A${fRow.number}:I${fRow.number}`)
                fRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
                fRow.getCell(1).alignment = leftW
                fRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
                fRow.height = 28
            } else {
                const dRow = ws.addRow(r.cells)
                dRow.height = 38
                dRow.eachCell((cell, col) => {
                    cell.font = { name: fontTH, size: CONTENT_FONT_SIZE }
                    cell.border = border
                    cell.alignment = [1, 4, 5, 6, 7, 8, 9].includes(col) ? centerW : leftW
                })
                dataCount++
            }
        })

        // Summary
        const sumRow = ws.addRow([`จำนวนหลักสูตรทั้งหมด ${dataCount} หลักสูตร`])
        ws.mergeCells(`A${sumRow.number}:I${sumRow.number}`)
        sumRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE }
        sumRow.getCell(1).alignment = leftW
        sumRow.height = 36

        const buffer = await wb.xlsx.writeBuffer()

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="curriculum_report.xlsx"',
            }
        })
    } catch (err) {
        console.error('[exportCurriculumExcel]', err)
        set.status = 500
        return { error: err.message }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT — รายงานหลักสูตร  (เนื้อหา font 16 + ตัดคำขึ้นบรรทัดใหม่)
// ══════════════════════════════════════════════════════════════════════════════
export const exportCurriculumPDF = async ({ query, set, store }) => {
    try {
        const courses = await fetchCourses({ ...query, store })
        const rows = toRows(courses)

        const pdfDoc = await PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)
        const { font, fontBold } = await loadFonts(pdfDoc)

        const W = 841.89, H = 595.28   // A4 landscape (pt)
        const margin = 24
        const black = rgb(0, 0, 0)

        const sz = CONTENT_FONT_SIZE
        const HEADERS = ['ที่', 'รหัสหลักสูตร', 'ชื่อหลักสูตร', 'หลักสูตร/ปีที่ใช้', 'เริ่ม', 'สิ้นสุด', 'วันที่รับรอง', 'ครั้งที่', 'หน่วยงาน']
        const colWidths = [30, 95, 230, 130, 48, 48, 80, 48, 65]  // รวม ~774pt
        const totalW = colWidths.reduce((a, b) => a + b, 0)

        let page = pdfDoc.addPage([W, H])
        let y = H - margin

        // ── หัวข้อรายงาน (ไม่เปลี่ยนขนาด) ──
        const levelLabel = eduLevelTitle(query.education_level)
        page.drawText(`รายงานหลักสูตร${levelLabel ? ` ${levelLabel}` : ''}`, { x: margin, y: y - 16, size: 20, font: fontBold, color: black }); y -= 22
        page.drawText('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', { x: margin, y: y - 14, size: 16, font: fontBold, color: black }); y -= 22

        // ── วาด header แถวตาราง (เนื้อหา → 16, wrap ได้) ──
        const drawHeader = () => {
            const wrapped = HEADERS.map((h, i) => wrapTextLines(h, fontBold, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const hdrH = maxLines * LINE_H + PAD

            if (y - hdrH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin }

            let x = margin
            page.drawRectangle({ x: margin, y: y - hdrH, width: totalW, height: hdrH, color: rgb(0.93, 0.95, 0.99), borderColor: black, borderWidth: 0.5 })
            HEADERS.forEach((h, i) => {
                const lines = wrapped[i]
                const blockH = lines.length * LINE_H
                const startY = y - (hdrH - blockH) / 2 - LINE_H + (LINE_H - sz) / 2
                lines.forEach((line, li) => {
                    const tw = fontBold.widthOfTextAtSize(line, sz)
                    page.drawText(line, { x: x + (colWidths[i] - tw) / 2, y: startY - li * LINE_H, size: sz, font: fontBold, color: black })
                })
                if (i > 0) page.drawLine({ start: { x, y: y - hdrH }, end: { x, y }, color: black, thickness: 0.5 })
                x += colWidths[i]
            })
            y -= hdrH
        }

        // ── แถวชื่อคณะ ──
        const drawFacultyRow = (text) => {
            const wrapped = wrapTextLines(text, fontBold, sz, totalW - 10, 1)
            const rowH = wrapped.length * LINE_H + PAD
            if (y - rowH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }
            page.drawRectangle({ x: margin, y: y - rowH, width: totalW, height: rowH, color: rgb(0.85, 0.85, 0.85), borderColor: black, borderWidth: 0.5 })
            page.drawText(wrapped[0], { x: margin + 5, y: y - rowH + (rowH - sz) / 2, size: sz, font: fontBold, color: black })
            y -= rowH
        }

        // ── แถวข้อมูล — ความสูงคำนวณอัตโนมัติจากจำนวนบรรทัด ──
        const centerCols = [0, 3, 4, 5, 6, 7, 8]
        const drawDataRow = (cells) => {
            const wrapped = cells.map((val, i) => wrapTextLines(val, font, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const rowH = maxLines * LINE_H + PAD

            if (y - rowH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }

            let x = margin
            cells.forEach((val, i) => {
                page.drawRectangle({ x, y: y - rowH, width: colWidths[i], height: rowH, borderColor: black, borderWidth: 0.5, color: rgb(1, 1, 1) })
                const lines = wrapped[i]
                lines.forEach((line, li) => {
                    const tw = font.widthOfTextAtSize(line, sz)
                    const tx = centerCols.includes(i) ? x + (colWidths[i] - tw) / 2 : x + 3
                    const ty = y - PAD / 2 - (li + 1) * LINE_H + (LINE_H - sz) / 2
                    page.drawText(line, { x: tx, y: ty, size: sz, font, color: black })
                })
                x += colWidths[i]
            })
            y -= rowH
        }

        drawHeader()

        let dataCount = 0
        for (const r of rows) {
            if (r.type === 'faculty') {
                drawFacultyRow(r.name)
            } else {
                drawDataRow(r.cells)
                dataCount++
            }
        }

        y -= 16
        if (y < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin }
        page.drawText(`จำนวนหลักสูตรทั้งหมด ${dataCount} หลักสูตร`, { x: margin, y, size: sz, font, color: black })

        const pages = pdfDoc.getPages()
        pages.forEach((p, idx) => {
            const txt = `หน้า ${idx + 1} / ${pages.length}`
            const tw = font.widthOfTextAtSize(txt, 9)
            p.drawText(txt, { x: W - margin - tw, y: margin - 12, size: 9, font, color: black })
        })

        const pdfBytes = await pdfDoc.save()

        return new Response(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="curriculum_report.pdf"',
            }
        })
    } catch (err) {
        console.error('[exportCurriculumPDF]', err)
        set.status = 500
        return { error: err.message }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// รายงานอาจารย์ — ค่าคงที่ร่วม
// ══════════════════════════════════════════════════════════════════════════════
const EDU_LEVEL_LABEL = { bachelor: 'ปริญญาตรี', master: 'ปริญญาโท', doctoral: 'ปริญญาเอก' }
const EDU_LEVEL_ORDER = { bachelor: 1, master: 2, doctoral: 3 }

const formatProgramType2 = (c) => {
    const t = c.program_type === 'new' ? 'ใหม่' : 'ปรับปรุง'
    return `${t}(พ.ศ. ${c.curriculum_year ?? '-'})`
}
// เพิ่ม helper แปล education_level → ชื่อภาษาไทย (วางไว้ใกล้ๆ formatProgramType)
const eduLevelTitle = (level) => {
    if (level === 'bachelor') return 'ปริญญาตรี'
    if (level === 'master') return 'ปริญญาโท'
    if (level === 'doctoral') return 'ปริญญาเอก'
    return '' // 'all' หรือไม่ระบุ → ไม่แสดงระดับ
}
const teacherName = (t) =>
    `${t.title_name ?? ''}${t.first_name_th ?? ''} ${t.last_name_th ?? ''}`.trim()

// ══════════════════════════════════════════════════════════════════════════════
// รายงาน A — "รายงานอาจารย์ประจำหลักสูตร" (เดิม, flat list ตามคณะ)
// ใช้: exportTeachersExcel / exportTeachersPDF
// ══════════════════════════════════════════════════════════════════════════════

// ─── ดึงข้อมูลแบบ flat — 1 แถวต่อ 1 หลักสูตร (ใช้ chair = ผู้รับผิดชอบ หรือคนแรก) ──
const fetchTeacherCommittees = async ({ year, faculty_id, education_level, committee_role, store }) => {
    const user = store?.user
    const role = user?.roles?.role_name
    const curriculumWhere = {}

    if (role === 'teacher') {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (teacher?.department_id) curriculumWhere.department_id = teacher.department_id
    }
    if (faculty_id && faculty_id !== 'all') {
        curriculumWhere.departments = { faculty_id: Number(faculty_id) }
    }
    if (year && year !== 'all') {
        curriculumWhere.curriculum_year = Number(year)
    }
    if (education_level && education_level !== 'all') {
        curriculumWhere.education_level = education_level
    }

    const committeeWhere = { is_active: true }
    if (Object.keys(curriculumWhere).length) committeeWhere.tb_curriculum = curriculumWhere
    if (committee_role && committee_role !== 'all') committeeWhere.committee_role = committee_role

    return prisma.curriculum_committee.findMany({
        where: committeeWhere,
        include: {
            teachers: {
                select: { title_name: true, first_name_th: true, last_name_th: true, academic_position: true, phone: true }
            },
            tb_curriculum: {
                include: { departments: { include: { faculties: true } } }
            }
        },
        orderBy: [
            { tb_curriculum: { departments: { faculties: { faculty_name_th: 'asc' } } } },
            { tb_curriculum: { curriculum_name_th: 'asc' } },
        ],
    })
}

const toTeacherRows = (committees) => {
    const grouped = groupByFaculty(
        committees,
        c => c.tb_curriculum?.departments?.faculties?.faculty_name_th
    )
    const rows = []
    let seq = 1

    for (const [facultyName, items] of grouped) {
        rows.push({ type: 'faculty', name: facultyName })
        const byCurriculum = new Map()
        for (const item of items) {
            const cId = item.tb_curriculum?.curriculum_id ?? 'unknown'
            if (!byCurriculum.has(cId)) byCurriculum.set(cId, { curriculum: item.tb_curriculum, members: [] })
            byCurriculum.get(cId).members.push(item)
        }
        for (const { curriculum, members } of byCurriculum.values()) {
            const chair = members.find(m => m.responsibility === 'responsible') ?? members[0]
            const teacher = chair?.teachers
            const nameOnly = `${teacher?.first_name_th ?? ''} ${teacher?.last_name_th ?? ''}`.trim() || '-'
            rows.push({
                type: 'data',
                cells: [
                    String(seq++),
                    curriculum?.curriculum_name_th ?? '-',
                    chair?.committee_role ?? '-',
                    teacher?.academic_position ?? '-',
                    nameOnly,
                    teacher?.phone ?? '-',
                ]
            })
        }
    }
    return rows
}

// ── EXCEL: รายงานอาจารย์ประจำหลักสูตร (เดิม) ──
export const exportTeachersExcel = async ({ query, set, store }) => {
    try {
        const committees = await fetchTeacherCommittees({ ...query, store })
        const rows = toTeacherRows(committees)

        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('รายงานอาจารย์ประจำหลักสูตร')
        ws.pageSetup.orientation = 'landscape'
        ws.pageSetup.paperSize = 9
        ws.pageSetup.fitToPage = true
        ws.pageSetup.fitToWidth = 1

        const fontTH = 'TH Sarabun New'
        const centerW = { horizontal: 'center', vertical: 'middle', wrapText: true }
        const leftW = { horizontal: 'left', vertical: 'middle', wrapText: true }
        const thin = { style: 'thin' }
        const border = { top: thin, bottom: thin, left: thin, right: thin }
        const COLS = 'F'

        ws.columns = [
            { width: 8 },
            { width: 55 },
            { width: 22 },
            { width: 26 },
            { width: 26 },
            { width: 16 },
        ]

        const addTitle = (text, size = 14, bold = true) => {
            const row = ws.addRow([text])
            ws.mergeCells(`A${row.number}:${COLS}${row.number}`)
            row.getCell(1).font = { name: fontTH, size, bold }
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
            row.height = size + 8
        }
        addTitle('รายงานข้อมูลอาจารย์ประจำหลักสูตร', 14)
        addTitle('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', 14)
        ws.addRow([])

        const HEADERS = ['ที่', 'ชื่อหลักสูตร', 'ตำแหน่งในหลักสูตร', 'ตำแหน่งทางวิชาการ', 'ชื่อ-สกุล', 'เบอร์ติดต่อ']
        const hRow = ws.addRow(HEADERS)
        hRow.height = 40
        hRow.eachCell(cell => {
            cell.font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
            cell.alignment = centerW
            cell.border = border
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } }
        })

        let dataCount = 0
        rows.forEach(r => {
            if (r.type === 'faculty') {
                const fRow = ws.addRow([r.name])
                ws.mergeCells(`A${fRow.number}:${COLS}${fRow.number}`)
                fRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
                fRow.getCell(1).alignment = leftW
                fRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
                fRow.height = 28
            } else {
                const dRow = ws.addRow(r.cells)
                dRow.height = 38
                dRow.eachCell((cell, col) => {
                    cell.font = { name: fontTH, size: CONTENT_FONT_SIZE }
                    cell.border = border
                    cell.alignment = [1, 3, 4, 6].includes(col) ? centerW : leftW
                })
                dataCount++
            }
        })

        const sumRow = ws.addRow([`จำนวนหลักสูตรทั้งหมด ${dataCount} หลักสูตร`])
        ws.mergeCells(`A${sumRow.number}:${COLS}${sumRow.number}`)
        sumRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE }
        sumRow.getCell(1).alignment = leftW
        sumRow.height = 36

        const buffer = await wb.xlsx.writeBuffer()
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="teachers_report.xlsx"',
            }
        })
    } catch (err) {
        console.error('[exportTeachersExcel]', err)
        set.status = 500
        return { error: err.message }
    }
}

// ── PDF: รายงานอาจารย์ประจำหลักสูตร (เดิม) ──
export const exportTeachersPDF = async ({ query, set, store }) => {
    try {
        const committees = await fetchTeacherCommittees({ ...query, store })
        const rows = toTeacherRows(committees)

        const pdfDoc = await PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)
        const { font, fontBold } = await loadFonts(pdfDoc)

        const W = 595.28, H = 841.89   // A4 portrait
        const margin = 30
        const black = rgb(0, 0, 0)

        const sz = CONTENT_FONT_SIZE
        const HEADERS = ['ที่', 'ชื่อหลักสูตร', 'ตำแหน่งในหลักสูตร', 'ตำแหน่งวิชาการ', 'ชื่อ-สกุล', 'เบอร์']
        const colWidths = [28, 155, 88, 95, 100, 60]   // รวม ~526pt
        const totalW = colWidths.reduce((a, b) => a + b, 0)

        let page = pdfDoc.addPage([W, H])
        let y = H - margin

        page.drawText('รายงานข้อมูลอาจารย์ประจำหลักสูตร', { x: margin, y: y - 14, size: 16, font: fontBold, color: black }); y -= 20
        page.drawText('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', { x: margin, y: y - 12, size: 16, font: fontBold, color: black }); y -= 18

        const drawHeader = () => {
            const wrapped = HEADERS.map((h, i) => wrapTextLines(h, fontBold, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const hdrH = maxLines * LINE_H + PAD
            if (y - hdrH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin }

            let x = margin
            page.drawRectangle({ x: margin, y: y - hdrH, width: totalW, height: hdrH, color: rgb(0.93, 0.95, 0.99), borderColor: black, borderWidth: 0.5 })
            HEADERS.forEach((h, i) => {
                const lines = wrapped[i]
                const blockH = lines.length * LINE_H
                const startY = y - (hdrH - blockH) / 2 - LINE_H + (LINE_H - sz) / 2
                lines.forEach((line, li) => {
                    const tw = fontBold.widthOfTextAtSize(line, sz)
                    page.drawText(line, { x: x + (colWidths[i] - tw) / 2, y: startY - li * LINE_H, size: sz, font: fontBold, color: black })
                })
                if (i > 0) page.drawLine({ start: { x, y: y - hdrH }, end: { x, y }, color: black, thickness: 0.5 })
                x += colWidths[i]
            })
            y -= hdrH
        }

        const drawFacultyRow = (text) => {
            const wrapped = wrapTextLines(text, fontBold, sz, totalW - 10, 1)
            const rowH = wrapped.length * LINE_H + PAD
            if (y - rowH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }
            page.drawRectangle({ x: margin, y: y - rowH, width: totalW, height: rowH, color: rgb(0.85, 0.85, 0.85), borderColor: black, borderWidth: 0.5 })
            page.drawText(wrapped[0], { x: margin + 4, y: y - rowH + (rowH - sz) / 2, size: sz, font: fontBold, color: black })
            y -= rowH
        }

        const centerCols = [0, 2, 5]
        const drawDataRow = (cells) => {
            const wrapped = cells.map((val, i) => wrapTextLines(val, font, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const rowH = maxLines * LINE_H + PAD
            if (y - rowH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }

            let x = margin
            cells.forEach((val, i) => {
                page.drawRectangle({ x, y: y - rowH, width: colWidths[i], height: rowH, borderColor: black, borderWidth: 0.5, color: rgb(1, 1, 1) })
                const lines = wrapped[i]
                lines.forEach((line, li) => {
                    const tw = font.widthOfTextAtSize(line, sz)
                    const tx = centerCols.includes(i) ? x + (colWidths[i] - tw) / 2 : x + 3
                    const ty = y - PAD / 2 - (li + 1) * LINE_H + (LINE_H - sz) / 2
                    page.drawText(line, { x: tx, y: ty, size: sz, font, color: black })
                })
                x += colWidths[i]
            })
            y -= rowH
        }

        drawHeader()
        let dataCount = 0
        for (const r of rows) {
            if (r.type === 'faculty') drawFacultyRow(r.name)
            else { drawDataRow(r.cells); dataCount++ }
        }

        y -= 16
        if (y < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin }
        page.drawText(`จำนวนหลักสูตรทั้งหมด ${dataCount} หลักสูตร`, { x: margin, y, size: sz, font, color: black })

        const pages = pdfDoc.getPages()
        pages.forEach((p, idx) => {
            const txt = `หน้า ${idx + 1} / ${pages.length}`
            const tw = font.widthOfTextAtSize(txt, 9)
            p.drawText(txt, { x: W - margin - tw, y: margin - 14, size: 9, font, color: black })
        })

        const pdfBytes = await pdfDoc.save()
        return new Response(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="teachers_report.pdf"',
            }
        })
    } catch (err) {
        console.error('[exportTeachersPDF]', err)
        set.status = 500
        return { error: err.message }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// รายงาน B — "ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร" (ใหม่, จัดกลุ่มคณะ→ระดับ)
// ใช้: exportResponsibleExcel / exportResponsiblePDF
// ══════════════════════════════════════════════════════════════════════════════

const fetchTeachersData = async ({ year, faculty_id, education_level, store }) => {
    const user = store?.user
    const role = user?.roles?.role_name
    let whereClause = {}

    if (role === 'teacher') {
        const teacher = await prisma.teachers.findFirst({ where: { user_id: user.id } })
        if (teacher?.department_id) whereClause.department_id = teacher.department_id
    }
    if (faculty_id && faculty_id !== 'all') {
        whereClause.departments = { faculty_id: Number(faculty_id) }
    }
    if (year && year !== 'all') {
        whereClause.curriculum_year = Number(year)
    }
    if (education_level && education_level !== 'all') {
        whereClause.education_level = education_level
    }

    return prisma.tb_curriculum.findMany({
        where: whereClause,
        orderBy: [
            { departments: { faculties: { faculty_name_th: 'asc' } } },
            { education_level: 'asc' },
            { curriculum_id: 'asc' }
        ],
        include: {
            departments: { include: { faculties: true } },
            curriculum_committee: {
                where: { is_active: true },
                include: {
                    teachers: {
                        select: { title_name: true, first_name_th: true, last_name_th: true, academic_position: true }
                    }
                },
                orderBy: { committee_id: 'asc' }
            }
        }
    })
}

const groupTeachersData = (courses) => {
    const facMap = new Map()
    for (const c of courses) {
        const facName = c.departments?.faculties?.faculty_name_th ?? 'ไม่ระบุคณะ'
        if (!facMap.has(facName)) facMap.set(facName, new Map())
        const levelMap = facMap.get(facName)
        const level = c.education_level ?? 'bachelor'
        if (!levelMap.has(level)) levelMap.set(level, [])
        levelMap.get(level).push(c)
    }
    return facMap
}

// ── EXCEL: ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร (ใหม่) ──
export const exportResponsibleExcel = async ({ query, set, store }) => {
    try {
        const courses = await fetchTeachersData({ ...query, store })
        const grouped = groupTeachersData(courses)

        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('ผู้รับผิดชอบหลักสูตร')
        ws.pageSetup.orientation = 'landscape'
        ws.pageSetup.paperSize = 9
        ws.pageSetup.fitToPage = true

        const fontTH = 'TH Sarabun New'
        const center = { horizontal: 'center', vertical: 'middle', wrapText: true }
        const left = { horizontal: 'left', vertical: 'middle', wrapText: true }
        const thin = { style: 'thin' }
        const border = { top: thin, bottom: thin, left: thin, right: thin }

        const addTitle = (text, size = 14, bold = true) => {
            const row = ws.addRow([text])
            ws.mergeCells(`A${row.number}:H${row.number}`)
            row.getCell(1).font = { name: fontTH, size, bold }
            row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' }
            row.height = size + 8
        }
        addTitle('รายงานผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร', 14)
        addTitle('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', 14)
        ws.addRow([])

        ws.columns = [
            { width: 8 },
            { width: 16 },
            { width: 55 },
            { width: 18 },
            { width: 14 },
            { width: 6 },
            { width: 32 },
            { width: 32 },
        ]

        const HEADERS = ['ลำดับ', 'รหัสหลักสูตร', 'ชื่อหลักสูตร', 'ปรับปรุง/ใหม่', 'แขนงวิชา', 'ลำดับ', 'ผู้รับผิดชอบหลักสูตร (ตำแหน่ง)', 'อาจารย์ประจำหลักสูตร']
        const hRow = ws.addRow(HEADERS)
        hRow.height = 46
        hRow.eachCell(cell => {
            cell.font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
            cell.alignment = center
            cell.border = border
        })

        let seq = 1
        for (const [facName, levelMap] of grouped) {
            const facRow = ws.addRow([facName])
            ws.mergeCells(`A${facRow.number}:H${facRow.number}`)
            facRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
            facRow.getCell(1).alignment = left
            facRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
            facRow.height = 28

            const levels = [...levelMap.keys()].sort((a, b) => (EDU_LEVEL_ORDER[a] ?? 9) - (EDU_LEVEL_ORDER[b] ?? 9))
            for (const level of levels) {
                const lvlRow = ws.addRow([EDU_LEVEL_LABEL[level] ?? level])
                ws.mergeCells(`A${lvlRow.number}:H${lvlRow.number}`)
                lvlRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE, bold: true }
                lvlRow.getCell(1).alignment = left
                lvlRow.height = 26

                for (const c of levelMap.get(level)) {
                    const responsible = c.curriculum_committee.filter(m => m.responsibility === 'responsible')
                    const all = c.curriculum_committee
                    const maxRows = Math.max(responsible.length, all.length, 1)

                    for (let i = 0; i < maxRows; i++) {
                        const resp = responsible[i]
                        const member = all[i]
                        const rowData = [
                            i === 0 ? String(seq) : '',
                            i === 0 ? (c.curriculum_code ?? '-') : '',
                            i === 0 ? (c.curriculum_name_th ?? '-') : '',
                            i === 0 ? formatProgramType2(c) : '',
                            '',
                            resp ? String(i + 1) : '',
                            resp ? `${teacherName(resp.teachers)} (${resp.teachers.academic_position ?? 'อาจารย์'})` : '',
                            member ? teacherName(member.teachers) : '',
                        ]
                        const dRow = ws.addRow(rowData)
                        dRow.height = 46
                        dRow.eachCell((cell, col) => {
                            cell.font = { name: fontTH, size: CONTENT_FONT_SIZE }
                            cell.border = border
                            cell.alignment = [1, 6].includes(col) ? center : left
                        })
                    }
                    seq++
                }
            }
        }

        const sumRow = ws.addRow([`จำนวนหลักสูตรทั้งหมด ${courses.length} หลักสูตร`])
        ws.mergeCells(`A${sumRow.number}:H${sumRow.number}`)
        sumRow.getCell(1).font = { name: fontTH, size: CONTENT_FONT_SIZE }
        sumRow.getCell(1).alignment = left
        sumRow.height = 36

        const buffer = await wb.xlsx.writeBuffer()
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="responsible_report.xlsx"',
            }
        })
    } catch (err) {
        console.error('[exportResponsibleExcel]', err)
        set.status = 500
        return { error: err.message }
    }
}

// ── PDF: ผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร (ใหม่) ──
export const exportResponsiblePDF = async ({ query, set, store }) => {
    try {
        const courses = await fetchTeachersData({ ...query, store })
        const grouped = groupTeachersData(courses)

        const pdfDoc = await PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)
        const { font, fontBold } = await loadFonts(pdfDoc)

        const W = 841.89, H = 595.28, margin = 24
        const black = rgb(0, 0, 0)
        const gray = rgb(0.85, 0.85, 0.85)

        const sz = CONTENT_FONT_SIZE
        const HEADERS = ['ลำดับ', 'รหัสหลักสูตร', 'ชื่อหลักสูตร', 'ปรับปรุง/ใหม่', 'แขนงวิชา', '#', 'ผู้รับผิดชอบ (ตำแหน่ง)', 'อาจารย์ประจำ']
        const colWidths = [26, 75, 200, 78, 45, 22, 175, 175]
        const totalW = colWidths.reduce((a, b) => a + b, 0)

        let page = pdfDoc.addPage([W, H])
        let y = H - margin

        const drawHeader = () => {
            const wrapped = HEADERS.map((h, i) => wrapTextLines(h, fontBold, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const hdrH = maxLines * LINE_H + PAD
            if (y - hdrH < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin }

            let x = margin
            page.drawRectangle({ x: margin, y: y - hdrH, width: totalW, height: hdrH, color: rgb(0.93, 0.95, 0.99), borderColor: black, borderWidth: 0.5 })
            HEADERS.forEach((h, i) => {
                const lines = wrapped[i]
                const blockH = lines.length * LINE_H
                const startY = y - (hdrH - blockH) / 2 - LINE_H + (LINE_H - sz) / 2
                lines.forEach((line, li) => {
                    const tw = fontBold.widthOfTextAtSize(line, sz)
                    page.drawText(line, { x: x + (colWidths[i] - tw) / 2, y: startY - li * LINE_H, size: sz, font: fontBold, color: black })
                })
                if (i > 0) page.drawLine({ start: { x, y: y - hdrH }, end: { x, y }, color: black, thickness: 0.5 })
                x += colWidths[i]
            })
            y -= hdrH
            return hdrH
        }

        const drawGroupRow = (text, bold = false) => {
            const wrapped = wrapTextLines(text, bold ? fontBold : font, sz, totalW - 10, 1)
            const rowHeight = wrapped.length * LINE_H + PAD
            if (y - rowHeight < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }
            page.drawRectangle({ x: margin, y: y - rowHeight, width: totalW, height: rowHeight, color: bold ? gray : rgb(0.95, 0.95, 0.95), borderColor: black, borderWidth: 0.5 })
            page.drawText(wrapped[0], { x: margin + 4, y: y - rowHeight + (rowHeight - sz) / 2, size: sz, font: bold ? fontBold : font, color: black })
            y -= rowHeight
        }

        const centerCols = [0, 5]
        const drawDataRow = (cells) => {
            const wrapped = cells.map((val, i) => wrapTextLines(val, font, sz, colWidths[i] - 6, 2))
            const maxLines = Math.max(1, ...wrapped.map(w => w.length))
            const rowHeight = maxLines * LINE_H + PAD
            if (y - rowHeight < margin + 20) { page = pdfDoc.addPage([W, H]); y = H - margin; drawHeader() }

            let x = margin
            cells.forEach((val, i) => {
                page.drawRectangle({ x, y: y - rowHeight, width: colWidths[i], height: rowHeight, color: rgb(1, 1, 1), borderColor: black, borderWidth: 0.5 })
                const lines = wrapped[i]
                lines.forEach((line, li) => {
                    const tw = font.widthOfTextAtSize(line, sz)
                    const tx = centerCols.includes(i) ? x + (colWidths[i] - tw) / 2 : x + 3
                    const ty = y - PAD / 2 - (li + 1) * LINE_H + (LINE_H - sz) / 2
                    page.drawText(line, { x: tx, y: ty, size: sz, font, color: black })
                })
                x += colWidths[i]
            })
            y -= rowHeight
        }

        page.drawText('รายงานผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร', { x: margin, y: y - 16, size: 16, font: fontBold, color: black }); y -= 20
        page.drawText('ฝ่ายวิชาการ มหาวิทยาลัยราชภัฎมหาสารคาม', { x: margin, y: y - 12, size: 16, font: fontBold, color: black }); y -= 18
        drawHeader()

        let seq = 1
        for (const [facName, levelMap] of grouped) {
            drawGroupRow(facName, true)
            const levels = [...levelMap.keys()].sort((a, b) => (EDU_LEVEL_ORDER[a] ?? 9) - (EDU_LEVEL_ORDER[b] ?? 9))
            for (const level of levels) {
                drawGroupRow(`${EDU_LEVEL_LABEL[level] ?? level}`, false)
                for (const c of levelMap.get(level)) {
                    const responsible = c.curriculum_committee.filter(m => m.responsibility === 'responsible')
                    const all = c.curriculum_committee
                    const maxRows = Math.max(responsible.length, all.length, 1)

                    for (let i = 0; i < maxRows; i++) {
                        const resp = responsible[i]
                        const member = all[i]
                        drawDataRow([
                            i === 0 ? String(seq) : '',
                            i === 0 ? (c.curriculum_code ?? '-') : '',
                            i === 0 ? (c.curriculum_name_th ?? '-') : '',
                            i === 0 ? formatProgramType2(c) : '',
                            '',
                            resp ? String(i + 1) : '',
                            resp ? `${teacherName(resp.teachers)} (${resp.teachers.academic_position ?? 'อาจารย์'})` : '',
                            member ? teacherName(member.teachers) : '',
                        ])
                    }
                    seq++
                }
            }
        }

        const totalPages = pdfDoc.getPages().length
        pdfDoc.getPages().forEach((p, idx) => {
            const txt = `หน้า ${idx + 1} / ${totalPages}`
            const tw = font.widthOfTextAtSize(txt, 9)
            p.drawText(txt, { x: W - margin - tw, y: margin - 12, size: 9, font, color: black })
        })

        const pdfBytes = await pdfDoc.save()
        return new Response(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="responsible_report.pdf"',
            }
        })
    } catch (err) {
        console.error('[exportResponsiblePDF]', err)
        set.status = 500
        return { error: err.message }
    }
}