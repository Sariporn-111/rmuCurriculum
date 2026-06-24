// src/pages/officer/Report.jsx
import React, { useState, useEffect } from 'react'
import { MainLayout } from '../../components/MainLayout'
import {
    FileText, BookOpen, Award, History,
    Users, BarChart2, User, PieChart,
    FileSpreadsheet, FileDown, ChevronDown, RotateCcw
} from 'lucide-react'
import {
    exportCurriculumExcel,
    exportCurriculumPDF,
    exportTeachersExcel,
    exportTeachersPDF,
    exportResponsibleExcel,
    exportResponsiblePDF,
} from '../../utils/reportExport'
import api from '../../services/api'

// ─── ตำแหน่งในหลักสูตร (ต้องตรงกับ CommitteeModal.jsx) ──────────────────────
const COMMITTEE_ROLE_OPTIONS = [
    { value: 'all', label: 'ทุกตำแหน่ง' },
    { value: 'ประธานกรรมการ', label: 'ประธานกรรมการ' },
    { value: 'รองประธานกรรมการ', label: 'รองประธานกรรมการ' },
    { value: 'กรรมการ', label: 'กรรมการ' },
    { value: 'เลขานุการ', label: 'เลขานุการ' },
    { value: 'ผู้ช่วยเลขานุการ', label: 'ผู้ช่วยเลขานุการ' },
]

const EDUCATION_LEVELS = [
    { value: 'all', label: 'ทุกระดับ' },
    { value: 'bachelor', label: 'ปริญญาตรี' },
    { value: 'master', label: 'ปริญญาโท' },
    { value: 'doctoral', label: 'ปริญญาเอก' },
]

const PROGRAM_TYPES = [
    { value: 'all', label: 'ทุกประเภท' },
    { value: 'new', label: 'หลักสูตรใหม่' },
    { value: 'revised', label: 'หลักสูตรปรับปรุง' },
]

const currentYear = new Date().getFullYear() + 543
const YEARS = [
    { value: 'all', label: 'ทุกปี' },
    ...Array.from({ length: 10 }, (_, i) => {
        const y = String(currentYear - i)
        return { value: y, label: y }
    }),
    { value: '__custom__', label: 'กรอกปีเอง...' },
]

const buildReportCards = (faculties) => [
    {
        id: 1, Icon: FileText, tag: 'หลักสูตร',
        title: 'รายงานข้อมูลหลักสูตร',
        subtitle: 'สรุปข้อมูลหลักสูตรทั้งหมดในระบบ แยกตามคณะ ระดับการศึกษา และปีหลักสูตร',
        filters: [
            { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
            { label: 'คณะ', key: 'faculty_id', options: faculties },
            { label: 'ระดับการศึกษา', key: 'education_level', options: EDUCATION_LEVELS },
            { label: 'ประเภทหลักสูตร', key: 'program_type', options: PROGRAM_TYPES },
        ],
        onExportExcel: (f) => exportCurriculumExcel(f),
        onExportPDF: (f) => exportCurriculumPDF(f),
    },
    // {
    //     id: 2, Icon: BookOpen, tag: 'หลักสูตร',
    //     title: 'รายงาน สมอ.08',
    //     subtitle: 'รายงานเอกสาร สมอ.08 ของแต่ละหลักสูตร พร้อมสถานะการอนุมัติ',
    //     filters: [
    //         { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
    //         { label: 'คณะ', key: 'faculty_id', options: faculties },
    //     ],
    //     onExportExcel: () => alert('TODO: เชื่อม API สมอ.08'),
    //     onExportPDF: () => alert('TODO: เชื่อม API สมอ.08'),
    // },
    // {
    //     id: 3, Icon: Award, tag: 'หลักสูตร',
    //     title: 'รายงานการรับรองคุณวุฒิ',
    //     subtitle: 'สรุปการรับรองคุณวุฒิหลักสูตร กพ. และ กพศ. แยกตามคณะและปี',
    //     filters: [
    //         { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
    //         { label: 'คณะ', key: 'faculty_id', options: faculties },
    //         { label: 'ระดับการศึกษา', key: 'education_level', options: EDUCATION_LEVELS },
    //     ],
    //     onExportExcel: () => alert('TODO: เชื่อม API รับรองคุณวุฒิ'),
    //     onExportPDF: () => alert('TODO: เชื่อม API รับรองคุณวุฒิ'),
    // },
    // {
    //     id: 4, Icon: History, tag: 'หลักสูตร',
    //     title: 'รายงานประวัติการแก้ไขหลักสูตร',
    //     subtitle: 'ประวัติการปรับปรุงและแก้ไขหลักสูตร พร้อมวันที่และผู้ดำเนินการ',
    //     filters: [
    //         { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
    //         { label: 'คณะ', key: 'faculty_id', options: faculties },
    //     ],
    //     onExportExcel: () => alert('TODO: เชื่อม API ประวัติแก้ไข'),
    //     onExportPDF: () => alert('TODO: เชื่อม API ประวัติแก้ไข'),
    // },
    {
        id: 5, Icon: Users, tag: 'อาจารย์',
        title: 'รายงานอาจารย์ประจำหลักสูตร',
        subtitle: 'ข้อมูลอาจารย์ผู้รับผิดชอบหลักสูตร ตำแหน่งวิชาการ และเบอร์ติดต่อ แยกตามคณะ',
        filters: [
            { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
            { label: 'คณะ', key: 'faculty_id', options: faculties },
            { label: 'ระดับการศึกษา', key: 'education_level', options: EDUCATION_LEVELS },
            { label: 'ตำแหน่งในหลักสูตร', key: 'committee_role', options: COMMITTEE_ROLE_OPTIONS },
        ],
        onExportExcel: (f) => exportTeachersExcel(f),
        onExportPDF: (f) => exportTeachersPDF(f),
    },
    {
        id: 9, Icon: Users, tag: 'อาจารย์',
        title: 'รายงานผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร',
        subtitle: 'รายชื่อผู้รับผิดชอบหลักสูตรและอาจารย์ประจำหลักสูตร จัดกลุ่มตามคณะและระดับการศึกษา พร้อมตำแหน่งทางวิชาการ',
        filters: [
            { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
            { label: 'คณะ', key: 'faculty_id', options: faculties },
            { label: 'ระดับการศึกษา', key: 'education_level', options: EDUCATION_LEVELS },
        ],
        onExportExcel: (f) => exportResponsibleExcel(f),
        onExportPDF: (f) => exportResponsiblePDF(f),
    },
    // {
    //     id: 6, Icon: BarChart2, tag: 'อาจารย์',
    //     title: 'รายงานภาระงานสอน',
    //     subtitle: 'สรุปภาระงานสอนของอาจารย์แต่ละท่าน แยกตามหลักสูตรและรายวิชา',
    //     filters: [
    //         { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
    //         { label: 'คณะ', key: 'faculty_id', options: faculties },
    //     ],
    //     onExportExcel: () => alert('TODO: เชื่อม API ภาระงาน'),
    //     onExportPDF: () => alert('TODO: เชื่อม API ภาระงาน'),
    // },
    // {
    //     id: 7, Icon: User, tag: 'อาจารย์',
    //     title: 'รายงานคุณวุฒิอาจารย์',
    //     subtitle: 'ข้อมูลคุณวุฒิและความเชี่ยวชาญของอาจารย์ประจำหลักสูตรทั้งหมด',
    //     filters: [
    //         { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
    //         { label: 'คณะ', key: 'faculty_id', options: faculties },
    //         { label: 'ระดับการศึกษา', key: 'education_level', options: EDUCATION_LEVELS },
    //     ],
    //     onExportExcel: () => alert('TODO: เชื่อม API คุณวุฒิ'),
    //     onExportPDF: () => alert('TODO: เชื่อม API คุณวุฒิ'),
    // },
    {
        id: 8, Icon: PieChart, tag: 'ภาพรวม',
        title: 'รายงานสรุปภาพรวมระบบ',
        subtitle: 'ภาพรวมสถิติและตัวชี้วัดสำคัญของระบบหลักสูตรและบุคลากรทั้งหมด',
        filters: [
            { label: 'ปีหลักสูตร (พ.ศ.)', key: 'year', options: YEARS },
        ],
        onExportExcel: () => alert('TODO: เชื่อม API ภาพรวม'),
        onExportPDF: () => alert('TODO: เชื่อม API ภาพรวม'),
    },
]

const SECTIONS = ['หลักสูตร', 'อาจารย์', 'ภาพรวม']

const TAG_STYLE = {
    'หลักสูตร': 'border-blue-200 bg-blue-50 text-blue-700',
    'อาจารย์': 'border-violet-200 bg-violet-50 text-violet-700',
    'ภาพรวม': 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

// ── YearFilter ────────────────────────────────────────────────────────────────
const YearFilter = ({ value, onChange }) => {
    const knownValues = YEARS.slice(1, -1).map(y => y.value)
    const isCustom = value !== 'all' && !knownValues.includes(value)
    const [mode, setMode] = useState(isCustom ? 'custom' : 'select')
    const [customVal, setCustomVal] = useState(isCustom ? value : '')

    useEffect(() => {
        if (value === 'all') { setMode('select'); setCustomVal('') }
    }, [value])

    const handleSelectChange = (v) => {
        if (v === '__custom__') { setMode('custom'); setCustomVal(''); onChange('all') }
        else { setMode('select'); onChange(v) }
    }

    const handleCustomChange = (e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, 4)
        setCustomVal(v)
        onChange(v.length === 4 ? v : 'all')
    }

    return (
        <div className="flex flex-col gap-1" style={{ minWidth: 150 }}>
            <label className="text-xs font-semibold text-gray-400">ปีหลักสูตร (พ.ศ.)</label>
            {mode === 'select' ? (
                <div className="relative">
                    <select
                        value={value}
                        onChange={e => handleSelectChange(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                        {YEARS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            ) : (
                <div className="flex gap-1.5">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={customVal}
                        onChange={handleCustomChange}
                        placeholder="เช่น 2550"
                        maxLength={4}
                        className="w-full rounded-xl border border-blue-300 bg-white py-2 px-3 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                        onClick={() => { setMode('select'); setCustomVal(''); onChange('all') }}
                        title="กลับไปเลือกจากรายการ"
                        className="flex items-center justify-center rounded-xl border border-gray-200 px-2.5 text-gray-400 hover:bg-gray-50"
                    >
                        <ChevronDown size={13} />
                    </button>
                </div>
            )}
        </div>
    )
}

// ── SelectFilter ──────────────────────────────────────────────────────────────
const SelectFilter = ({ label, options, value, onChange }) => (
    <div className="flex flex-col gap-1" style={{ minWidth: 140 }}>
        <label className="text-xs font-semibold text-gray-400">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
    </div>
)

// ── ReportCard ────────────────────────────────────────────────────────────────
const ReportCard = ({ card }) => {
    const { Icon, tag, title, subtitle, filters, onExportExcel, onExportPDF } = card

    const defaultValues = () => Object.fromEntries(
        filters.map(f => [f.key, f.options[0].value === '__custom__' ? 'all' : f.options[0].value])
    )

    const [filterValues, setFilterValues] = useState(defaultValues)
    const [loadingExcel, setLoadingExcel] = useState(false)
    const [loadingPDF, setLoadingPDF] = useState(false)

    useEffect(() => {
        setFilterValues(defaultValues())
    }, [filters.map(f => f.options.length).join(',')])

    const isFiltered = filters.some(f => {
        const v = filterValues[f.key]
        return v && v !== 'all' && v !== f.options[0].value
    })

    const handleReset = () => setFilterValues(defaultValues())

    const handleExport = async (type) => {
        const setLoading = type === 'excel' ? setLoadingExcel : setLoadingPDF
        const fn = type === 'excel' ? onExportExcel : onExportPDF
        try {
            setLoading(true)
            await fn(filterValues)
        } catch (err) {
            console.error('Export error:', err)
            alert('เกิดข้อผิดพลาดในการออกรายงาน')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 mt-0.5">
                            <Icon size={17} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-900">{title}</p>
                                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${TAG_STYLE[tag]}`}>
                                    {tag}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400 leading-relaxed max-w-md">{subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleExport('excel')}
                            disabled={loadingExcel}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                        >
                            <FileSpreadsheet size={13} />
                            {loadingExcel ? 'กำลังสร้าง...' : 'Excel'}
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={loadingPDF}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 disabled:opacity-50"
                        >
                            <FileDown size={13} />
                            {loadingPDF ? 'กำลังสร้าง...' : 'PDF'}
                        </button>
                    </div>
                </div>

                <div className="my-4 border-t border-gray-100" />

                <div className="flex flex-wrap items-end gap-3">
                    {filters.map(f =>
                        f.key === 'year' ? (
                            <YearFilter
                                key="year"
                                value={filterValues['year']}
                                onChange={val => setFilterValues(prev => ({ ...prev, year: val }))}
                            />
                        ) : (
                            <SelectFilter
                                key={f.key}
                                label={f.label}
                                options={f.options}
                                value={filterValues[f.key]}
                                onChange={val => setFilterValues(prev => ({ ...prev, [f.key]: val }))}
                            />
                        )
                    )}
                    {isFiltered && (
                        <button
                            onClick={handleReset}
                            className="mb-0.5 flex items-center gap-1.5 self-end rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 transition hover:border-gray-300 hover:bg-gray-100 active:scale-95"
                        >
                            <RotateCcw size={12} />
                            ล้างการกรอง
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Report Page ───────────────────────────────────────────────────────────────
const Report = () => {
    const [activeTab, setActiveTab] = useState('ทั้งหมด')
    const [faculties, setFaculties] = useState([{ value: 'all', label: 'ทุกคณะ' }])
    const [loadingFac, setLoadingFac] = useState(false)

    const tabs = ['ทั้งหมด', ...SECTIONS]

    useEffect(() => {
        const fetchFaculties = async () => {
            setLoadingFac(true)
            try {
                const res = await api.get('/faculties')
                const data = res.data.data || []
                setFaculties([
                    { value: 'all', label: 'ทุกคณะ' },
                    ...data.map(f => ({ value: String(f.id), label: f.faculty_name_th }))
                ])
            } catch (err) {
                console.error('fetch faculties error:', err)
            } finally {
                setLoadingFac(false)
            }
        }
        fetchFaculties()
    }, [])

    const reportCards = buildReportCards(faculties)
    const filtered = activeTab === 'ทั้งหมด'
        ? reportCards
        : reportCards.filter(c => c.tag === activeTab)

    return (
        <MainLayout role="officer">
            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">
                <div className="w-full">

                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">รายงาน</h1>
                        <p className="mt-0.5 text-xs text-gray-400">ออกรายงานข้อมูลหลักสูตรในรูปแบบต่างๆ</p>
                    </div>

                    <div className="mb-5 flex gap-0 border-b border-gray-200">
                        {tabs.map(tab => {
                            const count = tab === 'ทั้งหมด'
                                ? reportCards.length
                                : reportCards.filter(c => c.tag === tab).length
                            const active = activeTab === tab
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${active
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab}
                                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {loadingFac && (
                        <p className="mb-3 text-xs text-gray-400">กำลังโหลดรายชื่อคณะ...</p>
                    )}

                    <div className="space-y-6">
                        {SECTIONS.map(section => {
                            const cards = filtered.filter(c => c.tag === section)
                            if (!cards.length) return null
                            return (
                                <div key={section}>
                                    <div className="mb-3 flex items-center gap-3">
                                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TAG_STYLE[section]}`}>
                                            {section}
                                        </span>
                                        <div className="flex-1 border-t border-gray-100" />
                                    </div>
                                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))' }}>
                                        {cards.map(card => <ReportCard key={card.id} card={card} />)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                </div>
            </div>
        </MainLayout>
    )
}

export default Report