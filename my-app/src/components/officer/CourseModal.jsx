import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, Plus, Trash2, Pencil, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";

// ════════════════════════════════════════════
// SHARED STYLES
// ════════════════════════════════════════════
const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const readonlyCls = "bg-blue-50 text-blue-700";

// ════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════
const APPROVAL_TYPES = [
    { key: "faculty_committee", label: "1. คณะกรรมการประจำคณะ", short: "เสนอคณะ" },
    { key: "curriculum_committee", label: "2. คณะกรรมการวิชาการ", short: "กรรมการวิชาการ" },
    { key: "academic_council", label: "3. สภาวิชาการ", short: "สภาวิชาการ" },
    { key: "university_council", label: "4. สภามหาวิทยาลัย", short: "สภามหาวิทยาลัย" },
    { key: "professional_council", label: "5. สภาวิชาชีพ (ถ้ามี)", short: "สภาวิชาชีพ" },
];

const PROGRAM_FLAGS = [
    { value: "", label: "-- ไม่ระบุ --" },
    { value: "cwie", label: "CWIE (สหกิจศึกษา)" },
    { value: "WIL", label: "WIL (Work-Integrated Learning)" },
    { value: "bilingual", label: "หลักสูตรสองภาษา" },
    { value: "international", label: "หลักสูตรนานาชาติ" },
    { value: "continuing", label: "หลักสูตรต่อเนื่อง" },
];

const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const MEETING_RESULTS = [
    { value: "approved", label: "ผ่าน", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
    { value: "revision", label: "ขอแก้ไข", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertCircle },
    { value: "rejected", label: "ไม่ผ่าน", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
];

export const formatThaiDateInput = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

export const parseThaiDateToEngDate = (thaiDateStr) => {
    if (!thaiDateStr) return null;
    const parts = thaiDateStr.split("/");
    if (parts.length === 3) {
        const d = parts[0].trim();
        const m = parts[1].trim();
        const y = parts[2].trim();
        if (d.length === 2 && m.length === 2 && y.length === 4) {
            const engYear = Number(y) - 543;
            return `${engYear}-${m}-${d}`;
        }
    }
    return null;
};

export const parseEngDateToThaiDate = (engDateStr) => {
    if (!engDateStr) return "";
    const datePart = engDateStr.split("T")[0]; // "YYYY-MM-DD"
    const parts = datePart.split("-");
    if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        const thaiYear = Number(y) + 543;
        return `${d}/${m}/${thaiYear}`;
    }
    return "";
};

// ════════════════════════════════════════════
// EMPTY FORM
// ════════════════════════════════════════════
export const EMPTY_FORM = {
    faculty_id: "", department_id: "",
    curriculum_code: "", curriculum_name_th: "", curriculum_name_en: "",
    degree_type_id: "", degree_name_th: "", degree_name_en: "", degree_abbr_th: "", degree_abbr_en: "",
    major_name: "", total_credits: "120",
    curriculum_format: "", curriculum_format_other: "",
    curriculum_category: "", curriculum_category_other: "",
    teaching_language: "", teaching_language_other: "",
    admission_type: "", cooperation_type: "", cooperation_name: "",
    degree_award_type: "", degree_award_detail: "",
    curriculum_status: "new", old_curriculum_name: "", old_curriculum_year: "",
    start_term: "", start_academic_year: "",
    education_level: "bachelor", curriculum_year: "",
    revision_round: "1", is_backfill: false,
    effective_date: "", end_year: "", close_date: "", program_flag: "",
};

export const buildEditForm = (course) => ({
    faculty_id: String(course.departments?.faculty_id || ""),
    department_id: String(course.department_id || ""),
    curriculum_code: course.curriculum_code || "",
    curriculum_name_th: course.curriculum_name_th || "",
    curriculum_name_en: course.curriculum_name_en || "",
    degree_type_id: "0",
    degree_name_th: course.degree_name_th || "",
    degree_name_en: course.degree_name_en || "",
    degree_abbr_th: course.degree_abbr_th || "",
    degree_abbr_en: course.degree_abbr_en || "",
    major_name: course.major_name || "",
    total_credits: String(course.total_credits || "120"),
    curriculum_format: course.curriculum_format || "",
    curriculum_format_other: course.curriculum_format_other || "",
    curriculum_category: course.curriculum_category || "",
    curriculum_category_other: course.curriculum_category_other || "",
    teaching_language: course.teaching_language || "",
    teaching_language_other: course.teaching_language_other || "",
    admission_type: course.admission_type || "",
    cooperation_type: course.cooperation_type || "",
    cooperation_name: course.cooperation_name || "",
    degree_award_type: course.degree_award_type || "",
    degree_award_detail: course.degree_award_detail || "",
    curriculum_status: course.curriculum_status || "new",
    old_curriculum_name: course.old_curriculum_name || "",
    old_curriculum_year: course.old_curriculum_year ? String(course.old_curriculum_year) : "",
    start_term: course.start_term ? String(course.start_term) : "",
    start_academic_year: course.start_academic_year ? String(course.start_academic_year) : "",
    education_level: course.education_level || "bachelor",
    curriculum_year: course.curriculum_year ? String(course.curriculum_year) : "",
    revision_round: course.revision_round !== undefined ? String(course.revision_round) : "1",
    is_backfill: false,
    effective_date: course.effective_date ? parseEngDateToThaiDate(course.effective_date) : "",
    end_year: course.end_year ? String(course.end_year) : "",
    close_date: course.close_date ? String(new Date(course.close_date).getFullYear() + 543) : "",
    program_flag: course.program_flag || "",
});

// ════════════════════════════════════════════
// SHARED SMALL COMPONENTS
// ════════════════════════════════════════════
const Field = ({ label, required, action, children }) => (
    <div>
        <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">
                {label}{required && <span className="ml-0.5 text-red-400">*</span>}
            </label>
            {action}
        </div>
        {children}
    </div>
);

const SelectField = ({ children, disabled, ...props }) => (
    <div className="relative">
        <select {...props} disabled={disabled}
            className={`${selectCls} ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}`}>
            {children}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
);

const SectionTitle = ({ children }) => (
    <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">{children}</span>
        <div className="flex-1 border-t border-blue-100" />
    </div>
);

const AddBtn = ({ onClick, label }) => (
    <button type="button" onClick={onClick}
        className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
        <Plus size={11} />{label}
    </button>
);

const MiniPopup = ({ title, onClose, onSubmit, loading, submitLabel, children }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={15} /></button>
            </div>
            <div className="space-y-3 px-5 py-4">{children}</div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3.5">
                <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button onClick={onSubmit} disabled={loading}
                    className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {loading ? "กำลังบันทึก..." : submitLabel}
                </button>
            </div>
        </div>
    </div>
);

// ── Mini Popups ──
const AddFacultyPopup = ({ onClose, onSuccess }) => {
    const [nameTh, setNameTh] = useState(""); const [nameEn, setNameEn] = useState(""); const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        if (!nameTh.trim()) { Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อคณะ", "warning"); return; }
        try { setLoading(true); const res = await api.post("/faculties", { faculty_name_th: nameTh, faculty_name_en: nameEn }); onSuccess(res.data.data); onClose(); }
        catch { Swal.fire("ผิดพลาด", "เพิ่มคณะไม่สำเร็จ", "error"); } finally { setLoading(false); }
    };
    return (<MiniPopup title="เพิ่มคณะใหม่" onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="เพิ่มคณะ">
        <Field label="ชื่อคณะ (ไทย)" required><input value={nameTh} onChange={e => setNameTh(e.target.value)} placeholder="เช่น วิทยาศาสตร์และเทคโนโลยี" className={inputCls} /></Field>
        <Field label="ชื่อคณะ (อังกฤษ)"><input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Science and Technology" className={inputCls} /></Field>
    </MiniPopup>);
};

const AddDepartmentPopup = ({ facultyId, onClose, onSuccess }) => {
    const [nameTh, setNameTh] = useState(""); const [nameEn, setNameEn] = useState(""); const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        if (!nameTh.trim()) { Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อสาขา", "warning"); return; }
        try { setLoading(true); const res = await api.post("/faculties/departments", { faculty_id: Number(facultyId), department_name_th: nameTh, department_name_en: nameEn }); onSuccess(res.data.data); onClose(); }
        catch { Swal.fire("ผิดพลาด", "เพิ่มสาขาไม่สำเร็จ", "error"); } finally { setLoading(false); }
    };
    return (<MiniPopup title="เพิ่มสาขาใหม่" onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="เพิ่มสาขา">
        <Field label="ชื่อสาขา (ไทย)" required><input value={nameTh} onChange={e => setNameTh(e.target.value)} placeholder="เช่น วิทยาการคอมพิวเตอร์" className={inputCls} /></Field>
        <Field label="ชื่อสาขา (อังกฤษ)"><input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Computer Science" className={inputCls} /></Field>
    </MiniPopup>);
};

const AddDegreeTypePopup = ({ educationLevel, onClose, onSuccess }) => {
    const [dForm, setDForm] = useState({ name_th: "", name_en: "", abbr_th: "", abbr_en: "" }); const [loading, setLoading] = useState(false);
    const handleSubmit = async () => {
        if (!dForm.name_th.trim()) { Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อปริญญา (ไทย)", "warning"); return; }
        try { setLoading(true); const res = await api.post("/degree-types", { education_level: educationLevel, name_th: dForm.name_th, name_en: dForm.name_en || null, abbr_th: dForm.abbr_th || null, abbr_en: dForm.abbr_en || null, sort_order: 99 }); onSuccess(res.data.data); onClose(); }
        catch { Swal.fire("ผิดพลาด", "เพิ่มชื่อปริญญาไม่สำเร็จ", "error"); } finally { setLoading(false); }
    };
    return (<MiniPopup title="เพิ่มชื่อปริญญาใหม่" onClose={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="บันทึกและใช้งาน">
        <Field label="ชื่อปริญญา (ไทย)" required><input value={dForm.name_th} onChange={e => setDForm(p => ({ ...p, name_th: e.target.value }))} placeholder="เช่น วิทยาศาสตรบัณฑิต" className={inputCls} /></Field>
        <Field label="ชื่อปริญญา (อังกฤษ)"><input value={dForm.name_en} onChange={e => setDForm(p => ({ ...p, name_en: e.target.value }))} placeholder="Bachelor of Science" className={inputCls} /></Field>
        <Field label="ชื่อย่อ (ไทย)"><input value={dForm.abbr_th} onChange={e => setDForm(p => ({ ...p, abbr_th: e.target.value }))} placeholder="วท.บ." className={inputCls} /></Field>
        <Field label="ชื่อย่อ (อังกฤษ)"><input value={dForm.abbr_en} onChange={e => setDForm(p => ({ ...p, abbr_en: e.target.value }))} placeholder="B.Sc." className={inputCls} /></Field>
    </MiniPopup>);
};

// ════════════════════════════════════════════
// MEETING RESULT BADGE
// ════════════════════════════════════════════
const ResultBadge = ({ result }) => {
    const r = MEETING_RESULTS.find(x => x.value === result);
    if (!r) return <span className="text-xs text-gray-400">—</span>;
    const Icon = r.icon;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${r.color}`}>
            <Icon size={11} />{r.label}
        </span>
    );
};

// ════════════════════════════════════════════
// ADD/EDIT MEETING POPUP
// ════════════════════════════════════════════
const MeetingFormPopup = ({ curriculumId, approvalType, editData, onClose, onSuccess }) => {
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState(""); // พ.ศ.
    const [form, setForm] = useState({
        meeting_no: editData?.meeting_no || "",
        result: editData?.result || "",
        note: editData?.note || "",
    });
    const [loading, setLoading] = useState(false);

    const typeLabel = APPROVAL_TYPES.find(t => t.key === approvalType)?.label || approvalType;

    // ถ้า edit: populate วันที่จาก approval_date หรือ approval_month/approval_year
    useEffect(() => {
        if (!editData) return;

        // ถ้ามี approval_date → แปลงเป็น วัน/เดือน/ปีพ.ศ.
        if (editData.approval_date) {
            const d = new Date(editData.approval_date);
            if (!isNaN(d)) {
                setDay(String(d.getDate()).padStart(2, "0"));
                setMonth(String(d.getMonth() + 1));
                setYear(String(d.getFullYear() + 543));
                return;
            }
        }
        // ถ้าไม่มี approval_date แต่มี approval_month/approval_year
        if (editData.approval_month) setMonth(String(editData.approval_month));
        if (editData.approval_year) setYear(String(editData.approval_year));
    }, []);

    /**
     * สร้าง payload วันที่
     * - ถ้ากรอกครบ วัน/เดือน/ปี → คำนวณ approval_date (ISO) + เก็บ approval_month/approval_year ด้วย
     * - ถ้ากรอกแค่ เดือน/ปี → approval_date = null, เก็บแค่ approval_month/approval_year
     * - ถ้าไม่ได้กรอกอะไร → ทุก field = null
     */
    const buildDatePayload = () => {
        const m = month ? Number(month) : null;
        const y = year && year.length === 4 ? Number(year) - 543 : null; // แปลง พ.ศ. → ค.ศ.
        const d = day ? Number(day) : null;

        if (m && y && d) {
            const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            return { approval_date: iso, approval_month: m, approval_year: Number(year) };
        }
        if (m && y) {
            return { approval_date: null, approval_month: m, approval_year: Number(year) };
        }
        return { approval_date: null, approval_month: null, approval_year: null };
    };

    const handleSubmit = async () => {
        const datePayload = buildDatePayload();
        const payload = {
            approval_type: approvalType,
            meeting_no: form.meeting_no || null,
            ...datePayload,
            result: form.result || null,
            note: form.note || null,
        };

        try {
            setLoading(true);
            if (editData) {
                await api.put(`/courses/${curriculumId}/meetings/${editData.approval_id}`, payload);
            } else {
                await api.post(`/courses/${curriculumId}/meetings`, payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MiniPopup
            title={editData ? `แก้ไขการประชุม — ${typeLabel}` : `เพิ่มการประชุม — ${typeLabel}`}
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel={editData ? "บันทึกการแก้ไข" : "เพิ่มการประชุม"}
        >
            {/* ครั้งที่ประชุม */}
            <Field label="ครั้งที่ประชุม">
                <input value={form.meeting_no} onChange={e => setForm(p => ({ ...p, meeting_no: e.target.value }))}
                    placeholder="เช่น 3/2568" className={inputCls} />
            </Field>

            {/* วันที่ประชุม (พ.ศ.) — วันเป็น optional, เดือน+ปีเก็บแยกด้วย */}
            <Field label="วันที่ประชุม (พ.ศ.)">
                <div className="grid gap-1" style={{ gridTemplateColumns: "60px 1fr 76px" }}>
                    {/* วัน */}
                    <input
                        value={day}
                        onChange={e => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="วัน"
                        maxLength={2}
                        className={`${inputCls} text-center`}
                    />
                    {/* เดือน — ใช้ select ธรรมดาไม่ซ้อน div เพื่อหลีกเลี่ยง layout bug */}
                    <select
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
                    >
                        <option value="">— เดือน —</option>
                        {MONTHS_TH.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    {/* ปี พ.ศ. */}
                    <input
                        value={year}
                        onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="พ.ศ."
                        maxLength={4}
                        className={`${inputCls} text-center`}
                    />
                </div>
                <p className="mt-1 text-xs text-gray-400">วันที่ไม่จำเป็นต้องระบุ — เดือนและปี พ.ศ. จะถูกบันทึกเสมอ</p>
            </Field>

            {/* ผลการประชุม */}
            <Field label="ผลการประชุม">
                <div className="flex gap-2">
                    {MEETING_RESULTS.map(r => {
                        const Icon = r.icon;
                        const active = form.result === r.value;
                        return (
                            <button key={r.value} type="button"
                                onClick={() => setForm(p => ({ ...p, result: active ? "" : r.value }))}
                                className={`flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs font-medium transition
                                    ${active ? r.color + " ring-2 ring-offset-1 ring-current" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}>
                                <Icon size={13} />{r.label}
                            </button>
                        );
                    })}
                </div>
            </Field>

            {/* หมายเหตุ */}
            <Field label="หมายเหตุ">
                <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="สรุปมติ / ประเด็นที่ต้องแก้ไข"
                    rows={3} className={`${inputCls} resize-none`} />
            </Field>
        </MiniPopup>
    );
};

// ════════════════════════════════════════════
// helper: แสดงวันที่เป็นภาษาไทย
// รองรับกรณีมีแค่ เดือน+ปี โดยไม่มี approval_date
// ════════════════════════════════════════════
const formatDateTH = (m) => {
    // กรณีมี approval_date (วันที่เต็ม)
    if (m.approval_date) {
        const d = new Date(m.approval_date);
        if (!isNaN(d)) {
            return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
        }
    }
    // กรณีมีแค่ approval_month + approval_year
    if (m.approval_month && m.approval_year) {
        return `${MONTHS_TH[m.approval_month - 1]} ${m.approval_year}`;
    }
    return "—";
};

// ════════════════════════════════════════════
// TAB: ประวัติการประชุม
// ════════════════════════════════════════════
const MeetingsTab = ({ curriculumId }) => {
    const [grouped, setGrouped] = useState({});
    const [loadingData, setLoadingData] = useState(false);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [addForType, setAddForType] = useState(null);
    const [editData, setEditData] = useState(null);
    const [activeStep, setActiveStep] = useState(APPROVAL_TYPES[0].key);

    const fetchMeetings = useCallback(async () => {
        if (!curriculumId) return;
        try {
            setLoadingData(true);
            const res = await api.get(`/courses/${curriculumId}/meetings`);
            setGrouped(res.data.data || {});
        } catch {
            Swal.fire("ผิดพลาด", "โหลดข้อมูลการประชุมไม่สำเร็จ", "error");
        } finally {
            setLoadingData(false);
        }
    }, [curriculumId]);

    useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

    const handleDelete = async (approvalId) => {
        const res = await Swal.fire({
            title: "ยืนยันการลบ?", text: "ข้อมูลการประชุมนี้จะถูกลบถาวร",
            icon: "warning", showCancelButton: true,
            confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#ef4444",
        });
        if (!res.isConfirmed) return;
        try {
            await api.delete(`/courses/${curriculumId}/meetings/${approvalId}`);
            fetchMeetings();
        } catch {
            Swal.fire("ผิดพลาด", "ลบไม่สำเร็จ", "error");
        }
    };

    // นับจำนวนการประชุมต่อ step + status สุดท้าย
    const getStepSummary = (key) => {
        const list = grouped[key] || [];
        const count = list.length;
        const last = list[list.length - 1];
        return { count, lastResult: last?.result || null };
    };

    const currentList = grouped[activeStep] || [];

    if (!curriculumId) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Clock size={32} className="mb-2 opacity-40" />
                <p className="text-sm">บันทึกหลักสูตรก่อนเพื่อเพิ่มการประชุม</p>
            </div>
        );
    }

    return (
        <div className="flex h-full gap-0">
            {/* ── LEFT: Step Navigator ── */}
            <div className="w-44 shrink-0 border-r border-gray-100 py-2">
                {APPROVAL_TYPES.map(t => {
                    const { count, lastResult } = getStepSummary(t.key);
                    const isActive = activeStep === t.key;
                    const resultColor = lastResult === "approved" ? "bg-green-400"
                        : lastResult === "revision" ? "bg-amber-400"
                            : lastResult === "rejected" ? "bg-red-400" : "bg-gray-300";
                    return (
                        <button key={t.key} onClick={() => setActiveStep(t.key)}
                            className={`w-full text-left px-3 py-2.5 transition
                                ${isActive ? "bg-blue-50 border-r-2 border-blue-500" : "hover:bg-gray-50"}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium leading-tight ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                                    {t.short}
                                </span>
                                {count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">{count}</span>
                                        <span className={`h-2 w-2 rounded-full ${resultColor}`} />
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── RIGHT: Meeting List ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-800">
                            {APPROVAL_TYPES.find(t => t.key === activeStep)?.label}
                        </p>
                        <p className="text-xs text-gray-400">{currentList.length} ครั้ง</p>
                    </div>
                    <button
                        onClick={() => { setAddForType(activeStep); setEditData(null); setShowAddPopup(true); }}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                        <Plus size={13} /> เพิ่มการประชุม
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {loadingData ? (
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Clock size={28} className="mb-2 opacity-30" />
                            <p className="text-xs">ยังไม่มีบันทึกการประชุม</p>
                            <p className="text-xs text-gray-300">กดปุ่ม "เพิ่มการประชุม" เพื่อเริ่มต้น</p>
                        </div>
                    ) : (
                        currentList.map((m, idx) => (
                            <div key={m.approval_id}
                                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                                {/* ลำดับ */}
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                    {idx + 1}
                                </div>
                                {/* ข้อมูล */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {m.meeting_no && (
                                            <span className="text-xs font-semibold text-gray-700">ครั้งที่ {m.meeting_no}</span>
                                        )}
                                        <ResultBadge result={m.result} />
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-500">{formatDateTH(m)}</p>
                                    {m.note && (
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{m.note}</p>
                                    )}
                                </div>
                                {/* Actions */}
                                <div className="flex shrink-0 gap-1">
                                    <button onClick={() => { setEditData(m); setAddForType(activeStep); setShowAddPopup(true); }}
                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(m.approval_id)}
                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Popup */}
            {showAddPopup && (
                <MeetingFormPopup
                    curriculumId={curriculumId}
                    approvalType={addForType}
                    editData={editData}
                    onClose={() => setShowAddPopup(false)}
                    onSuccess={fetchMeetings}
                />
            )}
        </div>
    );
};

// ════════════════════════════════════════════
// MAIN MODAL — with Tabs
// ════════════════════════════════════════════
const CourseModal = ({ open, isEdit, form, setForm, onClose, onSuccess, selectedId }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("info"); // "info" | "meetings"
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [degreeTypes, setDegreeTypes] = useState([]);
    const [showAddFaculty, setShowAddFaculty] = useState(false);
    const [showAddDept, setShowAddDept] = useState(false);
    const [showAddDegree, setShowAddDegree] = useState(false);

    useEffect(() => {
        if (open) { fetchFaculties(); setActiveTab("info"); }
    }, [open]);

    useEffect(() => {
        if (form.faculty_id) fetchDepartments(form.faculty_id);
        else setDepartments([]);
    }, [form.faculty_id]);

    useEffect(() => {
        if (open) fetchDegreeTypes(form.education_level);
    }, [form.education_level, open]);

    const fetchFaculties = async () => { try { const r = await api.get("/faculties"); setFaculties(r.data.data || []); } catch { } };
    const fetchDepartments = async (id) => { try { const r = await api.get(`/faculties/${id}/departments`); setDepartments(r.data.data || []); } catch { } };
    const fetchDegreeTypes = async (lv) => { try { const r = await api.get(`/degree-types?level=${lv}`); setDegreeTypes(r.data.data || []); } catch { } };

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        let val = value;
        if (name === "effective_date") {
            val = formatThaiDateInput(value);
        }
        setForm(prev => {
            const nextForm = { ...prev, [name]: val };
            if (name === "start_academic_year" && val && val.trim().length === 4 && !isNaN(val)) {
                const startYr = Number(val.trim());
                nextForm.end_year = String(startYr + 4);
                nextForm.close_date = String(startYr + 8);
            }
            return nextForm;
        });
    };
    const handleFacultyChange = (e) => setForm(prev => ({ ...prev, faculty_id: e.target.value, department_id: "" }));
    const handleEducationLevelChange = (e) => setForm(prev => ({ ...prev, education_level: e.target.value, degree_type_id: "", degree_name_th: "", degree_name_en: "", degree_abbr_th: "", degree_abbr_en: "" }));
    const handleDegreeTypeChange = (e) => {
        const id = Number(e.target.value);
        if (id === 0) { setShowAddDegree(true); return; }
        const sel = degreeTypes.find(d => d.id === id); if (!sel) return;
        setForm(prev => ({ ...prev, degree_type_id: String(id), degree_name_th: sel.name_th, degree_name_en: sel.name_en || "", degree_abbr_th: sel.abbr_th || "", degree_abbr_en: sel.abbr_en || "" }));
    };

    const handleFacultyAdded = (f) => { setFaculties(p => [...p, f]); setForm(p => ({ ...p, faculty_id: String(f.id), department_id: "" })); setDepartments([]); };
    const handleDepartmentAdded = (d) => { setDepartments(p => [...p, d]); setForm(p => ({ ...p, department_id: String(d.id) })); };
    const handleDegreeTypeAdded = (d) => { setDegreeTypes(p => [...p, d]); setForm(p => ({ ...p, degree_type_id: String(d.id), degree_name_th: d.name_th, degree_name_en: d.name_en || "", degree_abbr_th: d.abbr_th || "", degree_abbr_en: d.abbr_en || "" })); };

    const isCustomDegree = form.degree_type_id === "0";
    const isRevised = form.curriculum_status === "revised";
    const isBackfill = form.is_backfill === true;
    const degreeSelected = form.degree_type_id !== "";
    const showRevisionRound = isRevised || isBackfill;
    const isCollaboration = form.cooperation_type === "collaborative";
    const isMultiDegree = form.degree_award_type === "multiple";
    const isFormatOther = form.curriculum_format === "other";
    const isCategoryOther = form.curriculum_category === "other";
    const isLangOther = form.teaching_language === "other";

    const validate = () => {
        if (!form.department_id) { Swal.fire("แจ้งเตือน", "กรุณาเลือกสาขา", "warning"); return false; }
        if (!form.curriculum_name_th?.trim()) { Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อหลักสูตร (ไทย)", "warning"); return false; }
        if (!form.degree_name_th) { Swal.fire("แจ้งเตือน", "กรุณาเลือกหรือกรอกชื่อปริญญา", "warning"); return false; }
        if (!form.curriculum_year) { Swal.fire("แจ้งเตือน", "กรุณากรอกปี พ.ศ. ของหลักสูตร", "warning"); return false; }
        if (!form.total_credits) { Swal.fire("แจ้งเตือน", "กรุณากรอกจำนวนหน่วยกิต", "warning"); return false; }
        if (showRevisionRound && !form.revision_round) { Swal.fire("แจ้งเตือน", "กรุณากรอกรอบปรับปรุง", "warning"); return false; }
        if (isRevised && !form.old_curriculum_name?.trim()) { Swal.fire("แจ้งเตือน", "กรุณากรอกชื่อหลักสูตรเดิม", "warning"); return false; }
        if (form.effective_date) {
            const parsed = parseThaiDateToEngDate(form.effective_date);
            if (!parsed) {
                Swal.fire("แจ้งเตือน", "กรุณากรอก วันที่สภามหาวิทยาลัยอนุมัติ ให้ถูกต้องครบถ้วนในรูปแบบ วว/ดด/ปปปป (เช่น 29/06/2569)", "warning");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            const payload = {
                curriculum_code: form.curriculum_code?.trim() || null,
                curriculum_name_th: form.curriculum_name_th,
                curriculum_name_en: form.curriculum_name_en || null,
                degree_name_th: form.degree_name_th,
                degree_name_en: form.degree_name_en || null,
                degree_abbr_th: form.degree_abbr_th || null,
                degree_abbr_en: form.degree_abbr_en || null,
                major_name: form.major_name || null,
                total_credits: Number(form.total_credits),
                curriculum_format: form.curriculum_format || null,
                curriculum_format_other: isFormatOther ? (form.curriculum_format_other || null) : null,
                curriculum_category: form.curriculum_category || null,
                curriculum_category_other: isCategoryOther ? (form.curriculum_category_other || null) : null,
                teaching_language: form.teaching_language || null,
                teaching_language_other: isLangOther ? (form.teaching_language_other || null) : null,
                admission_type: form.admission_type || null,
                cooperation_type: form.cooperation_type || null,
                cooperation_name: isCollaboration ? (form.cooperation_name || null) : null,
                degree_award_type: form.degree_award_type || null,
                degree_award_detail: isMultiDegree ? (form.degree_award_detail || null) : null,
                curriculum_status: form.curriculum_status || "new",
                old_curriculum_name: isRevised ? (form.old_curriculum_name || null) : null,
                old_curriculum_year: isRevised && form.old_curriculum_year ? Number(form.old_curriculum_year) : null,
                start_term: form.start_term ? Number(form.start_term) : null,
                start_academic_year: form.start_academic_year ? Number(form.start_academic_year) : null,
                education_level: form.education_level,
                curriculum_year: Number(form.curriculum_year),
                revision_round: (form.curriculum_status === "new" && !isBackfill) ? 0 : Number(form.revision_round),
                effective_date: parseThaiDateToEngDate(form.effective_date),
                end_year: form.end_year ? Number(form.end_year) : null,
                close_date: (form.close_date && String(form.close_date).trim().length === 4)
                    ? `${Number(String(form.close_date).trim()) - 543}-01-01`
                    : (form.close_date || null),
                program_flag: form.program_flag || null,
                department_id: Number(form.department_id),
            };
            if (isEdit) await api.put(`/courses/${selectedId}`, payload);
            else await api.post("/courses", payload);
            Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
            onSuccess?.(); onClose();
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
        } finally { setLoading(false); }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "90vh" }}>

                    {/* ── HEADER ── */}
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {isEdit ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
                            </h2>
                            <p className="text-xs text-gray-400">{form.curriculum_name_th || "กรอกข้อมูลหลักสูตรให้ครบถ้วน"}</p>
                        </div>
                        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                            <X size={15} />
                        </button>
                    </div>

                    {/* ── TABS ── */}
                    <div className="flex shrink-0 border-b border-gray-100">
                        {[
                            { key: "info", label: "ข้อมูลหลักสูตร" },
                            { key: "meetings", label: "บันทึกการประชุม", disabled: !isEdit },
                        ].map(t => (
                            <button key={t.key}
                                onClick={() => !t.disabled && setActiveTab(t.key)}
                                disabled={t.disabled}
                                className={`px-5 py-3 text-xs font-semibold transition border-b-2
                                    ${activeTab === t.key
                                        ? "border-blue-500 text-blue-600"
                                        : t.disabled
                                            ? "border-transparent text-gray-300 cursor-not-allowed"
                                            : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                {t.label}
                                {t.disabled && <span className="ml-1 text-gray-300">(บันทึกก่อน)</span>}
                            </button>
                        ))}
                    </div>

                    {/* ── BODY ── */}
                    {activeTab === "info" ? (
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                            {/* สังกัด */}
                            <section>
                                <SectionTitle>สังกัด</SectionTitle>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="คณะ" required action={<AddBtn onClick={() => setShowAddFaculty(true)} label="เพิ่มคณะ" />}>
                                        <SelectField name="faculty_id" value={form.faculty_id || ""} onChange={handleFacultyChange}>
                                            <option value="">-- เลือกคณะ --</option>
                                            {faculties.map(f => <option key={f.id} value={f.id}>{f.faculty_name_th}</option>)}
                                        </SelectField>
                                    </Field>
                                    <Field label="สาขาวิชา" required action={
                                        <AddBtn onClick={() => { if (!form.faculty_id) { Swal.fire("แจ้งเตือน", "กรุณาเลือกคณะก่อน", "warning"); return; } setShowAddDept(true); }} label="เพิ่มสาขา" />
                                    }>
                                        <SelectField name="department_id" value={form.department_id || ""} onChange={handleChange} disabled={!form.faculty_id}>
                                            <option value="">{form.faculty_id ? "-- เลือกสาขา --" : "-- เลือกคณะก่อน --"}</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name_th}</option>)}
                                        </SelectField>
                                    </Field>
                                </div>
                            </section>

                            {/* 1.1 */}
                            <section>
                                <SectionTitle>1.1 รหัสและชื่อหลักสูตร</SectionTitle>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="รหัสหลักสูตร">
                                        <input name="curriculum_code" value={form.curriculum_code} maxLength={50}
                                            onChange={e => setForm(p => ({ ...p, curriculum_code: e.target.value.replace(/[^A-Za-z0-9_-]/g, "") }))}
                                            placeholder="เช่น CS-BSc-2568" className={inputCls} />
                                    </Field>
                                    <Field label="ระดับการศึกษา" required>
                                        <SelectField name="education_level" value={form.education_level} onChange={handleEducationLevelChange}>
                                            <option value="bachelor">ปริญญาตรี</option>
                                            <option value="master">ปริญญาโท</option>
                                            <option value="doctoral">ปริญญาเอก</option>
                                        </SelectField>
                                    </Field>
                                    <Field label="ชื่อหลักสูตร (ภาษาไทย)" required>
                                        <input name="curriculum_name_th" value={form.curriculum_name_th} maxLength={255} onChange={handleChange}
                                            placeholder="เช่น หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์" className={inputCls} />
                                    </Field>
                                    <Field label="ชื่อหลักสูตร (ภาษาอังกฤษ)">
                                        <input name="curriculum_name_en" value={form.curriculum_name_en} onChange={handleChange}
                                            placeholder="Bachelor of Science Program in Computer Science" className={inputCls} />
                                    </Field>
                                </div>
                            </section>

                            {/* 1.2 */}
                            <section>
                                <SectionTitle>1.2 ชื่อปริญญาและสาขาวิชา</SectionTitle>
                                <div className="space-y-3">
                                    <Field label="เลือกชื่อปริญญา" required action={<AddBtn onClick={() => setShowAddDegree(true)} label="เพิ่มชื่อปริญญา" />}>
                                        <SelectField name="degree_type_id" value={form.degree_type_id} onChange={handleDegreeTypeChange}>
                                            <option value="">-- เลือกจากรายการ --</option>
                                            {degreeTypes.map(d => <option key={d.id} value={d.id}>{d.name_th}</option>)}
                                            <option value="0">+ เพิ่มชื่อปริญญาใหม่</option>
                                        </SelectField>
                                    </Field>
                                    {degreeSelected && (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="ชื่อปริญญา (ชื่อเต็ม ภาษาไทย)" required>
                                                    <input name="degree_name_th" value={form.degree_name_th} onChange={handleChange}
                                                        readOnly={!isCustomDegree} placeholder="วิทยาศาสตรบัณฑิต"
                                                        className={`${inputCls} ${!isCustomDegree ? readonlyCls : ""}`} />
                                                </Field>
                                                <Field label="ชื่อปริญญา (ชื่อเต็ม ภาษาอังกฤษ)">
                                                    <input name="degree_name_en" value={form.degree_name_en} onChange={handleChange}
                                                        readOnly={!isCustomDegree} placeholder="Bachelor of Science"
                                                        className={`${inputCls} ${!isCustomDegree ? readonlyCls : ""}`} />
                                                </Field>
                                                <Field label="ชื่อย่อปริญญา (ภาษาไทย)">
                                                    <input name="degree_abbr_th" value={form.degree_abbr_th} onChange={handleChange}
                                                        readOnly={!isCustomDegree} placeholder="วท.บ."
                                                        className={`${inputCls} ${!isCustomDegree ? readonlyCls : ""}`} />
                                                </Field>
                                                <Field label="ชื่อย่อปริญญา (ภาษาอังกฤษ)">
                                                    <input name="degree_abbr_en" value={form.degree_abbr_en} onChange={handleChange}
                                                        readOnly={!isCustomDegree} placeholder="B.Sc."
                                                        className={`${inputCls} ${!isCustomDegree ? readonlyCls : ""}`} />
                                                </Field>
                                            </div>
                                            {!isCustomDegree && <p className="text-xs text-blue-500">ข้อมูลถูกกรอกอัตโนมัติ — เลือก "อื่นๆ" เพื่อกรอกเอง</p>}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 1.3 */}
                            <section>
                                <SectionTitle>1.3 วิชาเอกหรือแขนงวิชา (ถ้ามี)</SectionTitle>
                                <Field label="ชื่อวิชาเอก / แขนงวิชา">
                                    <input name="major_name" value={form.major_name || ""} onChange={handleChange}
                                        placeholder="เว้นว่างหากไม่มีวิชาเอก" className={inputCls} />
                                </Field>
                            </section>

                            {/* 1.4 */}
                            <section>
                                <SectionTitle>1.4 จำนวนหน่วยกิตรวมตลอดหลักสูตร</SectionTitle>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="หน่วยกิตรวมทั้งหมด" required>
                                        <input name="total_credits" type="number" value={form.total_credits} onChange={handleChange} placeholder="120" className={inputCls} />
                                    </Field>
                                </div>
                            </section>

                            {/* 1.5 */}
                            <section>
                                <SectionTitle>1.5 รูปแบบของหลักสูตร</SectionTitle>
                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.1 ระดับและรูปแบบหลักสูตร</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="รูปแบบหลักสูตร">
                                                <SelectField name="curriculum_format" value={form.curriculum_format || ""} onChange={handleChange}>
                                                    <option value="">-- เลือกรูปแบบ --</option>
                                                    <option value="bachelor_4_year">ปริญญาตรี 4 ปี</option>
                                                    <option value="bachelor_5_year">ปริญญาตรี 5 ปี</option>
                                                    <option value="bachelor_continuing">ปริญญาตรีต่อเนื่อง</option>
                                                    <option value="master">ปริญญาโท</option>
                                                    <option value="doctoral">ปริญญาเอก</option>
                                                    <option value="other">อื่น ๆ</option>
                                                </SelectField>
                                            </Field>
                                            {isFormatOther && <Field label="ระบุรูปแบบอื่น ๆ"><input name="curriculum_format_other" value={form.curriculum_format_other || ""} onChange={handleChange} placeholder="ระบุรูปแบบ" className={inputCls} /></Field>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.2 ประเภทของหลักสูตร</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="ประเภทหลักสูตร">
                                                <SelectField name="curriculum_category" value={form.curriculum_category || ""} onChange={handleChange}>
                                                    <option value="">-- เลือกประเภท --</option>
                                                    <optgroup label="หลักสูตรปริญญาตรีทางวิชาการ">
                                                        <option value="academic">หลักสูตรปริญญาตรีทางวิชาการ</option>
                                                        <option value="advanced_academic">หลักสูตรปริญญาตรีแบบก้าวหน้าทางวิชาการ</option>
                                                    </optgroup>
                                                    <optgroup label="หลักสูตรปริญญาตรีทางวิชาชีพหรือปฏิบัติการ">
                                                        <option value="professional">หลักสูตรปริญญาตรีทางวิชาชีพหรือปฏิบัติการ</option>
                                                        <option value="advanced_professional">หลักสูตรปริญญาตรีแบบก้าวหน้าทางวิชาชีพหรือปฏิบัติการ</option>
                                                    </optgroup>
                                                    <option value="other">อื่น ๆ</option>
                                                </SelectField>
                                            </Field>
                                            {isCategoryOther && <Field label="ระบุประเภทอื่น ๆ"><input name="curriculum_category_other" value={form.curriculum_category_other || ""} onChange={handleChange} placeholder="ระบุประเภท" className={inputCls} /></Field>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.3 ภาษาที่ใช้ในการจัดการเรียนการสอน</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="ภาษาการสอน">
                                                <SelectField name="teaching_language" value={form.teaching_language || ""} onChange={handleChange}>
                                                    <option value="">-- เลือกภาษา --</option>
                                                    <option value="thai">ภาษาไทย</option>
                                                    <option value="english">ภาษาอังกฤษ</option>
                                                    <option value="thai_english">ภาษาไทยและภาษาอังกฤษ</option>
                                                    <option value="other">อื่น ๆ</option>
                                                </SelectField>
                                            </Field>
                                            {isLangOther && <Field label="ระบุภาษาอื่น ๆ"><input name="teaching_language_other" value={form.teaching_language_other || ""} onChange={handleChange} placeholder="ระบุภาษา" className={inputCls} /></Field>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.4 การรับเข้าศึกษา</p>
                                        <Field label="การรับนักศึกษา">
                                            <SelectField name="admission_type" value={form.admission_type || ""} onChange={handleChange}>
                                                <option value="">-- เลือกประเภทการรับ --</option>
                                                <option value="thai_only">รับเฉพาะนักศึกษาไทย</option>
                                                <option value="foreign_only">รับเฉพาะนักศึกษาต่างชาติ</option>
                                                <option value="thai_and_foreign_thai_language">รับทั้งนักศึกษาไทยและนักศึกษาต่างชาติที่สามารถใช้ภาษาไทยได้</option>
                                                <option value="thai_and_foreign">รับทั้งนักศึกษาไทยและนักศึกษาต่างชาติ</option>
                                            </SelectField>
                                        </Field>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.5 ความร่วมมือกับสถาบันอื่น</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="ประเภทความร่วมมือ">
                                                <SelectField name="cooperation_type" value={form.cooperation_type || ""} onChange={handleChange}>
                                                    <option value="">-- เลือก --</option>
                                                    <option value="internal">เป็นหลักสูตรของมหาวิทยาลัยโดยตรง</option>
                                                    <option value="collaborative">เป็นหลักสูตรความร่วมมือกับสถาบันอื่น</option>
                                                </SelectField>
                                            </Field>
                                            {isCollaboration && <Field label="ชื่อหน่วยงาน/สถาบันที่ร่วมดำเนินการ" required><input name="cooperation_name" value={form.cooperation_name || ""} onChange={handleChange} placeholder="ชื่อสถาบัน" className={inputCls} /></Field>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">1.5.6 การให้ปริญญาแก่ผู้สำเร็จการศึกษา</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="การให้ปริญญา">
                                                <SelectField name="degree_award_type" value={form.degree_award_type || ""} onChange={handleChange}>
                                                    <option value="">-- เลือก --</option>
                                                    <option value="single">ให้ปริญญาเพียงสาขาวิชาเดียว</option>
                                                    <option value="multiple">ให้ปริญญามากกว่าหนึ่งสาขาวิชา</option>
                                                </SelectField>
                                            </Field>
                                            {isMultiDegree && <Field label="รายละเอียดปริญญา"><input name="degree_award_detail" value={form.degree_award_detail || ""} onChange={handleChange} placeholder="ระบุรายละเอียด" className={inputCls} /></Field>}
                                        </div>
                                    </div>
                                    <div>
                                        <Field label="โครงการ / รูปแบบพิเศษ">
                                            <SelectField name="program_flag" value={form.program_flag || ""} onChange={handleChange}>
                                                {PROGRAM_FLAGS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                            </SelectField>
                                        </Field>
                                    </div>
                                </div>
                            </section>

                            {/* 1.6 */}
                            <section>
                                <SectionTitle>1.6 สถานภาพของหลักสูตรและการพิจารณาอนุมัติ</SectionTitle>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="ประเภทหลักสูตร" required>
                                            <SelectField name="curriculum_status" value={form.curriculum_status || "new"} onChange={handleChange}>
                                                <option value="new">หลักสูตรใหม่</option>
                                                <option value="revised">หลักสูตรปรับปรุง</option>
                                            </SelectField>
                                        </Field>
                                        <Field label="ปีที่พัฒนา/ปรับปรุงหลักสูตร (พ.ศ.)" required>
                                            <input name="curriculum_year" value={form.curriculum_year} onChange={handleChange} placeholder="2568" className={inputCls} />
                                        </Field>
                                    </div>
                                    {!isRevised && (
                                        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                                            <input type="checkbox" id="is_backfill" checked={form.is_backfill || false}
                                                onChange={e => setForm(p => ({ ...p, is_backfill: e.target.checked, revision_round: e.target.checked ? p.revision_round : "0" }))}
                                                className="mt-0.5 h-4 w-4 cursor-pointer accent-amber-500" />
                                            <div>
                                                <label htmlFor="is_backfill" className="cursor-pointer text-xs font-semibold text-amber-700">บันทึกข้อมูลย้อนหลัง</label>
                                                <p className="mt-0.5 text-xs text-amber-600">ติ๊กเมื่อหลักสูตรนี้มีอยู่แล้วและมีการปรับปรุงไปแล้ว แต่เพิ่งนำเข้าระบบ</p>
                                            </div>
                                        </div>
                                    )}
                                    {isRevised && (
                                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
                                            <p className="text-xs font-semibold text-blue-700">ข้อมูลหลักสูตรเดิม</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="ชื่อหลักสูตรเดิม" required><input name="old_curriculum_name" value={form.old_curriculum_name || ""} onChange={handleChange} placeholder="ชื่อหลักสูตรเดิม" className={inputCls} /></Field>
                                                <Field label="ปี พ.ศ. ของหลักสูตรเดิม"><input name="old_curriculum_year" value={form.old_curriculum_year || ""} onChange={handleChange} placeholder="2562" className={inputCls} /></Field>
                                            </div>
                                        </div>
                                    )}
                                    {showRevisionRound && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={isBackfill ? "รอบปรับปรุงปัจจุบัน" : "รอบปรับปรุงที่"} required>
                                                <input name="revision_round" type="number" min="1" value={form.revision_round} onChange={handleChange}
                                                    placeholder={isBackfill ? "เช่น 2" : "1"} className={inputCls} />
                                            </Field>
                                        </div>
                                    )}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-gray-600">{isRevised ? "เริ่มใช้หลักสูตรปรับปรุง" : "เริ่มใช้หลักสูตร"}</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label="ภาคการศึกษาที่">
                                                <SelectField name="start_term" value={form.start_term || ""} onChange={handleChange}>
                                                    <option value="">-- เลือกภาคการศึกษา --</option>
                                                    <option value="1">ภาคการศึกษาที่ 1</option>
                                                    <option value="2">ภาคการศึกษาที่ 2</option>
                                                    <option value="3">ภาคการศึกษาที่ 3 (ภาคฤดูร้อน)</option>
                                                </SelectField>
                                            </Field>
                                            <Field label="ปีการศึกษาที่เริ่มใช้"><input name="start_academic_year" value={form.start_academic_year || ""} onChange={handleChange} placeholder="2568" className={inputCls} /></Field>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Field label="วันที่สภามหาวิทยาลัยอนุมัติ"><input name="effective_date" value={form.effective_date || ""} onChange={handleChange} placeholder="วว/ดด/ปปปป" className={inputCls} /></Field>
                                        <Field label="ปีสิ้นสุดหลักสูตร (พ.ศ.)"><input name="end_year" value={form.end_year || ""} onChange={handleChange} placeholder="2572" className={inputCls} /></Field>
                                        <Field label="ปีที่ปิดหลักสูตร (พ.ศ.)"><input name="close_date" value={form.close_date || ""} onChange={handleChange} placeholder="2572" className={inputCls} /></Field>
                                    </div>
                                </div>
                            </section>

                            {isRevised && (
                                <section>
                                    <SectionTitle>เอกสารประกอบการปรับปรุง</SectionTitle>
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                                        <p className="text-xs font-semibold text-blue-700">หลักสูตรปรับปรุง — ต้องแนบเอกสารเพิ่มเติม</p>
                                        <p className="mt-1 text-xs text-blue-600">หลังบันทึกหลักสูตรแล้ว กรุณาไปที่หน้า <strong>"ข้อมูล สมอ.08"</strong> เพื่ออัปโหลดเอกสารให้ครบถ้วน</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-xs text-blue-600">สมอ.08</span>
                                            <span className="rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-xs text-blue-600">มคอ.2</span>
                                            <span className="rounded-full bg-white border border-blue-200 px-2.5 py-0.5 text-xs text-blue-600">มติสภามหาวิทยาลัย</span>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : (
                        // TAB: บันทึกการประชุม
                        <div className="flex-1 overflow-hidden">
                            <MeetingsTab curriculumId={selectedId} />
                        </div>
                    )}

                    {/* ── FOOTER ── */}
                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-6 py-3.5">
                        <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                        {activeTab === "info" && (
                            <button onClick={handleSubmit} disabled={loading}
                                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 disabled:opacity-60">
                                {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มหลักสูตร"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showAddFaculty && <AddFacultyPopup onClose={() => setShowAddFaculty(false)} onSuccess={handleFacultyAdded} />}
            {showAddDept && <AddDepartmentPopup facultyId={form.faculty_id} onClose={() => setShowAddDept(false)} onSuccess={handleDepartmentAdded} />}
            {showAddDegree && <AddDegreeTypePopup educationLevel={form.education_level} onClose={() => setShowAddDegree(false)} onSuccess={handleDegreeTypeAdded} />}
        </>
    );
};

export default CourseModal;