import { useState, useEffect } from "react";
import { X, Search, UserPlus, Plus, Minus, ChevronDown } from "lucide-react";
import api from "../../../services/api";
import Swal from "sweetalert2";

// ─── ค่ามาตรฐาน ───────────────────────────────────────────────────────────────
export const COMMITTEE_ROLES = [
    "ประธานกรรมการ",
    "รองประธานกรรมการ",
    "กรรมการ",
    "เลขานุการ",
    "ผู้ช่วยเลขานุการ",
]

export const ACADEMIC_POSITIONS = [
    "อาจารย์",
    "ผู้ช่วยศาสตราจารย์",
    "รองศาสตราจารย์",
    "ศาสตราจารย์",
    "ผู้ช่วยศาสตราจารย์ ดร.",
    "รองศาสตราจารย์ ดร.",
    "ศาสตราจารย์ ดร.",
]

export const TITLE_NAMES = [
    "นาย", "นาง", "นางสาว",
    "อ.", "ดร.",
    "ผศ.", "ผศ.ดร.",
    "รศ.", "รศ.ดร.",
    "ศ.", "ศ.ดร.",
]

// ระดับการศึกษา (ตรงกับ enum EducationLevel)
const DEGREE_LEVELS = [
    { key: "bachelor", label: "ปริญญาตรี" },
    { key: "master", label: "ปริญญาโท" },
    { key: "doctoral", label: "ปริญญาเอก" },
]

const emptyEducation = (level) => ({
    degree_level: level,
    degree_name: "",
    major: "",
    faculty_name: "",
    university_name: "",
    country: "",
    graduation_year: "",
})

const formatPhoneDisplay = (digits) => {
    if (!digits) return "";
    const clean = digits.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
};

// form เริ่มต้นสำหรับอาจารย์ใหม่ (ผู้รับผิดชอบ — ครบ)
const EMPTY_TEACHER_FULL = {
    employee_code: "", title_name: "", first_name_th: "", last_name_th: "",
    first_name_en: "", last_name_en: "",
    academic_position: "",
    email: "", phone: "",
}

// form เริ่มต้นสำหรับอาจารย์ใหม่ (ประจำหลักสูตร — MVP)
const EMPTY_TEACHER_MVP = {
    employee_code: "", title_name: "", first_name_th: "", last_name_th: "",
    academic_position: "",
    email: "", phone: "",
}

const EMPTY_ROW = {
    selectedTeacher: null,
    searchText: "",
    committee_role: "",
    responsibility: "member",
    appointed_date: "",
}

// ─── SelectInput ──────────────────────────────────────────────────────────────
const SelectInput = ({ label, value, onChange, options, placeholder, required }) => (
    <div>
        <label className="mb-1 block text-xs text-gray-500">
            {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
                <option value="">{placeholder ?? "-- เลือก --"}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
    </div>
)

// ─── TextInput ────────────────────────────────────────────────────────────────
const TextInput = ({ label, value, onChange, placeholder, required, type = "text" }) => (
    <div>
        <label className="mb-1 block text-xs text-gray-500">
            {label}{required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
    </div>
)

// ─── SectionLabel ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{children}</p>
)

// ═════════════════════════════════════════════════════════════════════════════
export const CommitteeModal = ({
    open, onClose, onSuccess, editData,
    selectedCourseId, teachers, onTeacherAdded
}) => {
    const [modalMode, setModalMode] = useState("select")   // "select" | "addTeacher"
    const [newTeacherRole, setNewTeacherRole] = useState("member")  // บทบาทของอาจารย์ที่กำลังจะเพิ่ม

    const [count, setCount] = useState(1)
    const [rows, setRows] = useState([{ ...EMPTY_ROW }])

    // form อาจารย์ใหม่
    const [teacherForm, setTeacherForm] = useState({ ...EMPTY_TEACHER_FULL })

    // ประวัติการศึกษา (เฉพาะ responsible)
    const [educationForm, setEducationForm] = useState(
        DEGREE_LEVELS.map(d => emptyEducation(d.key))
    )

    // reset เมื่อเปิด modal
    useEffect(() => {
        if (!open) return
        if (editData) {
            setCount(1)
            setRows([{
                selectedTeacher: {
                    teacher_id: editData.teacher_id,
                    full_name: `${editData.teachers?.title_name ?? ""}${editData.teachers?.first_name_th ?? ""} ${editData.teachers?.last_name_th ?? ""}`,
                },
                searchText: "",
                committee_role: editData.committee_role ?? "",
                responsibility: editData.responsibility ?? "member",
                appointed_date: editData.appointed_date?.split("T")[0] ?? "",
            }])
        } else {
            setCount(1)
            setRows([{ ...EMPTY_ROW }])
        }
        setModalMode("select")
        setNewTeacherRole("member")
        setTeacherForm({ ...EMPTY_TEACHER_FULL })
        setEducationForm(DEGREE_LEVELS.map(d => emptyEducation(d.key)))
    }, [open, editData])

    // ── helpers ───────────────────────────────────────────────────────────────
    const handleCountChange = (n) => {
        const clamped = Math.max(1, Math.min(10, n))
        setCount(clamped)
        setRows(prev =>
            clamped > prev.length
                ? [...prev, ...Array(clamped - prev.length).fill(null).map(() => ({ ...EMPTY_ROW }))]
                : prev.slice(0, clamped)
        )
    }

    const updateRow = (index, field, value) =>
        setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))

    const updateEducationField = (idx, field, value) =>
        setEducationForm(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

    const setTf = (field, value) => {
        let val = value;
        if (field === "phone") {
            val = value.replace(/\D/g, "").slice(0, 10);
        }
        setTeacherForm(prev => ({ ...prev, [field]: val }));
    }

    // ── เปิดฟอร์มเพิ่มอาจารย์ใหม่ ────────────────────────────────────────────
    const openAddTeacher = (role = "member") => {
        setNewTeacherRole(role)
        setTeacherForm({ ...EMPTY_TEACHER_FULL })
        setEducationForm(DEGREE_LEVELS.map(d => emptyEducation(d.key)))
        setModalMode("addTeacher")
    }

    // ── save กรรมการ ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        for (let i = 0; i < rows.length; i++) {
            if (!rows[i].selectedTeacher)
                return Swal.fire("ผิดพลาด", `กรุณาเลือกอาจารย์ คนที่ ${i + 1}`, "error")
            if (!rows[i].committee_role)
                return Swal.fire("ผิดพลาด", `กรุณาเลือกตำแหน่งในหลักสูตร คนที่ ${i + 1}`, "error")
        }

        const teacherIds = rows.filter(r => r.selectedTeacher).map(r => r.selectedTeacher.teacher_id)
        if (new Set(teacherIds).size !== teacherIds.length)
            return Swal.fire("ผิดพลาด", "มีอาจารย์ซ้ำในรายการ", "error")

        if (rows.filter(r => r.responsibility === "responsible").length > 1)
            return Swal.fire("ผิดพลาด", "1 หลักสูตรมีผู้รับผิดชอบหลักสูตรได้เพียง 1 คน", "error")

        try {
            if (editData) {
                await api.put(`/committee/${editData.committee_id}`, {
                    committee_role: rows[0].committee_role,
                    responsibility: rows[0].responsibility,
                    appointed_date: rows[0].appointed_date,
                })
            } else {
                await api.post("/committee/bulk", {
                    course_id: selectedCourseId,
                    committees: rows.map(r => ({
                        teacher_id: r.selectedTeacher.teacher_id,
                        committee_role: r.committee_role,
                        responsibility: r.responsibility,
                        appointed_date: r.appointed_date,
                    })),
                })
            }
            onSuccess()
            onClose()
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกสำเร็จ", showConfirmButton: false, timer: 2000 })
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || err.message || "เกิดข้อผิดพลาด", "error")
        }
    }

    // ── เพิ่มอาจารย์ใหม่ ─────────────────────────────────────────────────────
    const handleAddTeacher = async () => {
        // validation พื้นฐาน
        if (!teacherForm.first_name_th || !teacherForm.last_name_th || !teacherForm.employee_code)
            return Swal.fire("ผิดพลาด", "กรุณากรอกข้อมูลที่จำเป็น (รหัสพนักงาน / ชื่อ / นามสกุล)", "error")

        if (teacherForm.phone && !/^[0-9]{9,10}$/.test(teacherForm.phone))
            return Swal.fire("ผิดพลาด", "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก", "error")

        // ถ้าเป็นผู้รับผิดชอบ ต้องมีชื่อมหาวิทยาลัยของระดับที่กรอกอย่างน้อย 1 ระดับ
        if (newTeacherRole === "responsible") {
            const hasAny = educationForm.some(e => e.university_name.trim())
            if (!hasAny)
                return Swal.fire("ผิดพลาด", "กรุณากรอกประวัติการศึกษาอย่างน้อย 1 ระดับ", "error")
        }

        try {
            const payload = {
                ...teacherForm,
                // ส่ง education เฉพาะระดับที่กรอกชื่อมหาวิทยาลัยแล้ว
                education: newTeacherRole === "responsible"
                    ? educationForm.filter(e => e.university_name.trim())
                    : [],
            }

            const res = await api.post("/teachers", payload)
            onTeacherAdded()

            // เลือกอาจารย์ที่เพิ่งสร้างเข้า row ที่ว่างอยู่
            const emptyIndex = rows.findIndex(r => !r.selectedTeacher)
            if (emptyIndex !== -1) {
                updateRow(emptyIndex, "selectedTeacher", {
                    teacher_id: res.data.teacher_id,
                    full_name: `${res.data.title_name ?? ""}${res.data.first_name_th} ${res.data.last_name_th}`,
                })
                // ตั้ง responsibility ของ row นั้นให้ตรงกับบทบาทที่เลือก
                updateRow(emptyIndex, "responsibility", newTeacherRole)
            }

            setModalMode("select")
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "เพิ่มอาจารย์สำเร็จ", showConfirmButton: false, timer: 2000 })
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "ไม่สามารถเพิ่มอาจารย์ได้", "error")
        }
    }

    if (!open) return null

    // ── title ─────────────────────────────────────────────────────────────────
    const modalTitle = modalMode === "addTeacher"
        ? (newTeacherRole === "responsible" ? "เพิ่มอาจารย์ผู้รับผิดชอบหลักสูตร" : "เพิ่มอาจารย์ประจำหลักสูตร")
        : editData ? "แก้ไขกรรมการ" : "เพิ่มกรรมการ"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{modalTitle}</h2>
                        {modalMode === "addTeacher" && (
                            <p className="mt-0.5 text-xs text-gray-400">
                                {newTeacherRole === "responsible"
                                    ? "กรอกข้อมูลครบถ้วนตามเล่มหลักสูตร รวมถึงประวัติการศึกษาทุกระดับ"
                                    : "กรอกเฉพาะข้อมูลที่จำเป็นสำหรับ MVP"}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">

                    {/* ══ โหมดเพิ่มอาจารย์ใหม่ ══════════════════════════════════════════════ */}
                    {modalMode === "addTeacher" ? (
                        <>
                            {/* ── ข้อมูลพื้นฐาน (ทั้งสองบทบาท) ── */}
                            <SectionLabel>ข้อมูลพื้นฐาน</SectionLabel>
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput label="รหัสพนักงาน" required
                                    value={teacherForm.employee_code}
                                    onChange={v => setTf("employee_code", v)}
                                    placeholder="เช่น EMP001" />

                                <SelectInput label="คำนำหน้า"
                                    value={teacherForm.title_name}
                                    onChange={v => setTf("title_name", v)}
                                    options={TITLE_NAMES}
                                    placeholder="-- เลือกคำนำหน้า --" />

                                <TextInput label="ชื่อ (ไทย)" required
                                    value={teacherForm.first_name_th}
                                    onChange={v => setTf("first_name_th", v)}
                                    placeholder="ชื่อภาษาไทย" />

                                <TextInput label="นามสกุล (ไทย)" required
                                    value={teacherForm.last_name_th}
                                    onChange={v => setTf("last_name_th", v)}
                                    placeholder="นามสกุลภาษาไทย" />

                                {/* ชื่อภาษาอังกฤษ (เฉพาะผู้รับผิดชอบ) */}
                                {newTeacherRole === "responsible" && (<>
                                    <TextInput label="ชื่อ (อังกฤษ)"
                                        value={teacherForm.first_name_en}
                                        onChange={v => setTf("first_name_en", v)}
                                        placeholder="First name" />
                                    <TextInput label="นามสกุล (อังกฤษ)"
                                        value={teacherForm.last_name_en}
                                        onChange={v => setTf("last_name_en", v)}
                                        placeholder="Last name" />
                                </>)}

                                <SelectInput label="ตำแหน่งทางวิชาการ"
                                    value={teacherForm.academic_position}
                                    onChange={v => setTf("academic_position", v)}
                                    options={ACADEMIC_POSITIONS}
                                    placeholder="-- เลือกตำแหน่ง --" />

                                <TextInput label="อีเมล"
                                    value={teacherForm.email}
                                    onChange={v => setTf("email", v)}
                                    placeholder="email@rmu.ac.th" />

                                <TextInput label="เบอร์โทร"
                                    value={formatPhoneDisplay(teacherForm.phone || "")}
                                    onChange={v => setTf("phone", v)}
                                    placeholder="0XX-XXX-XXXX" />
                            </div>

                            {/* ── ประวัติการศึกษา (เฉพาะผู้รับผิดชอบ) ── */}
                            {newTeacherRole === "responsible" && (
                                <>
                                    <SectionLabel>ประวัติการศึกษา</SectionLabel>
                                    <p className="text-xs text-gray-400 -mt-2">กรอกเฉพาะระดับที่มี ระดับที่ไม่ได้กรอกชื่อมหาวิทยาลัยจะไม่ถูกบันทึก</p>
                                    {DEGREE_LEVELS.map((lvl, idx) => (
                                        <div key={lvl.key} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
                                            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-900 text-[10px] font-bold text-white">
                                                    {idx + 1}
                                                </span>
                                                {lvl.label}
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <TextInput label="ชื่อปริญญา"
                                                    value={educationForm[idx].degree_name}
                                                    onChange={v => updateEducationField(idx, "degree_name", v)}
                                                    placeholder="เช่น วิทยาศาสตรบัณฑิต" />
                                                <TextInput label="สาขาวิชา"
                                                    value={educationForm[idx].major}
                                                    onChange={v => updateEducationField(idx, "major", v)}
                                                    placeholder="เช่น วิทยาการคอมพิวเตอร์" />
                                                <TextInput label="คณะ"
                                                    value={educationForm[idx].faculty_name}
                                                    onChange={v => updateEducationField(idx, "faculty_name", v)}
                                                    placeholder="เช่น คณะวิทยาศาสตร์" />
                                                <div>
                                                    <label className="mb-1 block text-xs text-gray-500">
                                                        มหาวิทยาลัย <span className="text-red-400">*</span>
                                                        <span className="ml-1 text-gray-400 font-normal normal-case">(จำเป็นถ้ากรอกระดับนี้)</span>
                                                    </label>
                                                    <input
                                                        value={educationForm[idx].university_name}
                                                        onChange={e => updateEducationField(idx, "university_name", e.target.value)}
                                                        placeholder="ชื่อมหาวิทยาลัย"
                                                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </div>
                                                <TextInput label="ประเทศ"
                                                    value={educationForm[idx].country}
                                                    onChange={v => updateEducationField(idx, "country", v)}
                                                    placeholder="เช่น ไทย" />
                                                <TextInput label="ปีที่จบ (พ.ศ.)" type="number"
                                                    value={educationForm[idx].graduation_year}
                                                    onChange={v => updateEducationField(idx, "graduation_year", v)}
                                                    placeholder="เช่น 2565" />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setModalMode("select")}
                                    className="rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                    ยกเลิก
                                </button>
                                <button onClick={handleAddTeacher}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                    บันทึกอาจารย์
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ══ โหมดเลือก/เพิ่มกรรมการ ════════════════════════════════════════ */
                        <>
                            {/* ── จำนวนกรรมการ (เพิ่มใหม่เท่านั้น) ── */}
                            {!editData && (
                                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                    <span className="text-sm font-medium text-blue-700">จำนวนกรรมการที่ต้องการเพิ่ม</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button onClick={() => handleCountChange(count - 1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-300 bg-white hover:bg-blue-100">
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-lg font-bold text-blue-800">{count}</span>
                                        <button onClick={() => handleCountChange(count + 1)}
                                            className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-300 bg-white hover:bg-blue-100">
                                            <Plus size={14} />
                                        </button>
                                        <span className="ml-1 text-xs text-blue-500">คน (สูงสุด 10)</span>
                                    </div>
                                </div>
                            )}

                            {/* ── Form แต่ละคน ── */}
                            {rows.map((row, index) => (
                                <div key={index} className="space-y-3 rounded-xl border bg-gray-50 p-4">
                                    {!editData && (
                                        <p className="text-sm font-semibold text-gray-600">กรรมการคนที่ {index + 1}</p>
                                    )}

                                    {/* เลือกอาจารย์ */}
                                    {!editData && (
                                        <div>
                                            <div className="mb-1 flex items-center justify-between">
                                                <label className="text-xs text-gray-500">
                                                    เลือกอาจารย์ <span className="text-red-400">*</span>
                                                </label>
                                                {index === 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openAddTeacher("responsible")}
                                                            className="flex items-center gap-1 rounded-lg bg-blue-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-950 transition">
                                                            <UserPlus size={12} /> ผู้รับผิดชอบหลักสูตรใหม่
                                                        </button>
                                                        <button
                                                            onClick={() => openAddTeacher("member")}
                                                            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                                                            <UserPlus size={12} /> อาจารย์ประจำใหม่
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {row.selectedTeacher ? (
                                                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                                                    <span className="text-sm font-medium text-blue-700">{row.selectedTeacher.full_name}</span>
                                                    <button onClick={() => updateRow(index, "selectedTeacher", null)}
                                                        className="text-gray-400 hover:text-red-500">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="relative">
                                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            value={row.searchText}
                                                            onChange={e => updateRow(index, "searchText", e.target.value)}
                                                            placeholder="พิมพ์ชื่ออาจารย์..."
                                                            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                                                        />
                                                    </div>
                                                    {row.searchText && (() => {
                                                        const filtered = teachers.filter(t => {
                                                            const fullName = `${t.title_name ?? ""}${t.first_name_th} ${t.last_name_th}`
                                                            return fullName.toLowerCase().includes(row.searchText.toLowerCase())
                                                        })
                                                        return (
                                                            <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border bg-white shadow-sm">
                                                                {filtered.length === 0 ? (
                                                                    <p className="py-3 text-center text-sm text-gray-400">ไม่พบอาจารย์</p>
                                                                ) : filtered.map(t => (
                                                                    <button key={t.teacher_id}
                                                                        onClick={() => {
                                                                            updateRow(index, "selectedTeacher", {
                                                                                teacher_id: t.teacher_id,
                                                                                full_name: `${t.title_name ?? ""}${t.first_name_th} ${t.last_name_th}`,
                                                                            })
                                                                            updateRow(index, "searchText", "")
                                                                        }}
                                                                        className="w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-blue-50">
                                                                        <span className="font-medium">{t.title_name}{t.first_name_th} {t.last_name_th}</span>
                                                                        {t.academic_position && (
                                                                            <span className="ml-2 text-xs text-gray-400">{t.academic_position}</span>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )
                                                    })()}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <SelectInput
                                                label="ตำแหน่งในหลักสูตร" required
                                                value={row.committee_role}
                                                onChange={v => updateRow(index, "committee_role", v)}
                                                options={COMMITTEE_ROLES}
                                                placeholder="-- เลือกตำแหน่ง --"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs text-gray-500">ความรับผิดชอบ</label>
                                            <div className="relative">
                                                <select
                                                    value={row.responsibility}
                                                    onChange={e => updateRow(index, "responsibility", e.target.value)}
                                                    className="w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-blue-400">
                                                    <option value="member">อาจารย์ประจำหลักสูตร</option>
                                                    <option value="responsible">ผู้รับผิดชอบหลักสูตร</option>
                                                </select>
                                                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>

                                        <TextInput label="วันที่แต่งตั้ง" type="date"
                                            value={row.appointed_date}
                                            onChange={v => updateRow(index, "appointed_date", v)} />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                {modalMode !== "addTeacher" && (
                    <div className="flex shrink-0 justify-end gap-2 border-t px-5 py-4">
                        <button onClick={onClose}
                            className="rounded-xl border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            ยกเลิก
                        </button>
                        <button onClick={handleSave}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95">
                            บันทึก{!editData && count > 1 ? ` (${count} คน)` : ""}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}