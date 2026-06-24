import {
    X, CheckCircle2, Clock3, XCircle, RotateCcw,
    MessageCircleMore, ArrowRight, AlertCircle, Undo2,
    Plus, History, ChevronDown, Trash2, Paperclip, FileX, ExternalLink
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const PROGRAM_TYPE_LABEL = { new: "หลักสูตรใหม่", revised: "หลักสูตรปรับปรุง" };
const EDU_LEVEL_LABEL = { bachelor: "ปริญญาตรี", master: "ปริญญาโท", doctoral: "ปริญญาเอก" };

// ตัวเลือก ohe_status
const OHE_STATUS_OPTIONS = [
    { value: "", label: "-- เลือกสถานะ --" },
    { value: "W", label: "W — รอส่ง" },
    { value: "W1", label: "W1 — ส่งไประดับมหาวิทยาลัยแล้ว" },
    { value: "S/1", label: "S/1 — ส่งไป สป.อว. ครั้งที่ 1" },
    { value: "S/2", label: "S/2 — ส่งไป สป.อว. ครั้งที่ 2" },
    { value: "S/3", label: "S/3 — ส่งไป สป.อว. ครั้งที่ 3" },
    { value: "E/1", label: "E/1 — ส่งกลับแก้ไข ครั้งที่ 1" },
    { value: "E/2", label: "E/2 — ส่งกลับแก้ไข ครั้งที่ 2" },
    { value: "A1/1", label: "A1/1 — หัวหน้าฝ่ายตรวจสอบ" },
    { value: "A2/1", label: "A2/1 — ผู้อำนวยการกลุ่มตรวจสอบ" },
    { value: "A3/1", label: "A3/1 — ผู้อำนวยการสำนัก/กองตรวจสอบ" },
    { value: "A4/1", label: "A4/1 — ปลัดกระทรวงตรวจสอบ" },
    { value: "P/1", label: "P/1 — พิจารณาความสอดคล้องและออกรหัสแล้ว" },
    { value: "other", label: "อื่นๆ — กรอกเอง" },
]

const formatDate = (val) => {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateInput = (val) => {
    if (!val) return "";
    return new Date(val).toISOString().split("T")[0];
};

// ── OHE Status Badge ────────────────────────────────────────────────────────
const OheBadge = ({ status }) => {
    if (!status || status === "-") return <span className="text-gray-400">-</span>;
    const colorMap = {
        P: "bg-green-100 text-green-700 border-green-200",
        S: "bg-blue-100 text-blue-700 border-blue-200",
        E: "bg-red-100 text-red-700 border-red-200",
        A: "bg-violet-100 text-violet-700 border-violet-200",
        W: "bg-amber-100 text-amber-700 border-amber-200",
    };
    const key = status.charAt(0).toUpperCase();
    const cls = colorMap[key] || "bg-gray-100 text-gray-600 border-gray-200";
    return (
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
            {status}
        </span>
    );
};

// ── Confirm Dialog ──────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, stepName, onConfirm, onCancel }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">ยืนยันการอนุมัติ</h3>
                <p className="mt-1 text-xs text-gray-500 leading-5">
                    คุณกำลังจะอนุมัติขั้นตอน <span className="font-semibold text-gray-700">"{stepName}"</span>
                    <br />การดำเนินการนี้สามารถย้อนกลับได้ภายใน 5 วินาที
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">ยกเลิก</button>
                    <button onClick={onConfirm} className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-600">ยืนยัน ผ่าน</button>
                </div>
            </div>
        </div>
    );
};

// ── Undo Toast ──────────────────────────────────────────────────────────────
const UndoToast = ({ visible, stepName, countdown, onUndo }) => (
    <div className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-2.5 shadow-2xl">
            <svg width="28" height="28" className="-rotate-90">
                <circle cx="14" cy="14" r="11" fill="none" stroke="#374151" strokeWidth="2.5" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="#22c55e" strokeWidth="2.5"
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - countdown / 5)}`}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <span className="text-xs text-gray-300">อนุมัติ <span className="font-semibold text-white">"{stepName}"</span> แล้ว</span>
            <button onClick={onUndo} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20">
                <Undo2 size={11} /> ย้อนกลับ ({countdown})
            </button>
        </div>
    </div>
);


// ── Step File Attach ────────────────────────────────────────────────────────
// แสดงในขั้นตอนที่ต้องการแนบไฟล์ (step 1 = มคอ.2, step 5 = สมอ.08)
const STEP_FILE_CONFIG = {
    1: { label: 'มคอ.2', desc: 'เอกสารรายละเอียดหลักสูตร' },
    5: { label: 'สมอ.08', desc: 'แบบรายงานข้อมูลหลักสูตรส่ง อว.' },
}

const StepFileAttach = ({ step, isOfficer, onRefresh }) => {
    const config = STEP_FILE_CONFIG[step.step_order]
    if (!config) return null

    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('file', file)
            await api.post(`/curriculum-process/${step.process_id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            await onRefresh()
        } catch (err) {
            console.error(err)
            alert('อัปโหลดไฟล์ไม่สำเร็จ')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async () => {
        if (!confirm(`ยืนยันการลบไฟล์ ${config.label}?`)) return
        try {
            await api.delete(`/curriculum-process/${step.process_id}/file`)
            await onRefresh()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="mt-2.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-2.5">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Paperclip size={11} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">{config.label}</span>
                    <span className="text-xs text-gray-400">— {config.desc}</span>
                </div>

                {step.file_path ? (
                    // มีไฟล์แล้ว
                    <div className="flex items-center gap-1.5">
                        <a
                            href={`http://localhost:3000${step.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                        >
                            <ExternalLink size={10} /> ดูไฟล์
                        </a>
                        {isOfficer && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-100"
                            >
                                <FileX size={10} /> ลบ
                            </button>
                        )}
                    </div>
                ) : (
                    // ยังไม่มีไฟล์
                    isOfficer && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <Paperclip size={10} />
                                {uploading ? 'กำลังอัปโหลด...' : `แนบ ${config.label}`}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleUpload}
                                className="hidden"
                            />
                        </>
                    )
                )}
            </div>

            {step.file_path && step.file_name && (
                <p className="mt-1 text-xs text-gray-400 truncate">
                    📎 {step.file_name}
                </p>
            )}
        </div>
    )
}

// ── OHE Tracking Section ────────────────────────────────────────────────────
const OheTrackingSection = ({ curriculumId, isOfficer, steps = [] }) => {
    const [trackings, setTrackings] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ ohe_status: "", custom_status: "", submitted_date: "", note: "" })
    const [editId, setEditId] = useState(null)

    const isCustom = form.ohe_status === "other"
    const finalStatus = isCustom ? form.custom_status : form.ohe_status

    useEffect(() => { fetchTrackings() }, [curriculumId])

    const fetchTrackings = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/ohe-tracking/curriculum/${curriculumId}`)
            setTrackings(res.data.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setForm({ ohe_status: "", custom_status: "", submitted_date: "", note: "" })
        setEditId(null)
        setShowForm(false)
    }

    const handleEdit = (t) => {
        const isKnown = OHE_STATUS_OPTIONS.some(o => o.value === t.ohe_status && o.value !== "" && o.value !== "other")
        setForm({
            ohe_status: isKnown ? t.ohe_status : "other",
            custom_status: isKnown ? "" : t.ohe_status,
            submitted_date: formatDateInput(t.submitted_date),
            note: t.note || "",
        })
        setEditId(t.tracking_id)
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!finalStatus.trim()) return
        try {
            setSaving(true)
            const payload = {
                curriculum_id: curriculumId,
                ohe_status: finalStatus,
                submitted_date: form.submitted_date || null,
                note: form.note || null,
            }
            if (editId) {
                await api.put(`/ohe-tracking/${editId}`, payload)
            } else {
                await api.post("/ohe-tracking", payload)
            }
            await fetchTrackings()
            resetForm()
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm("ยืนยันการลบ?")) return
        try {
            await api.delete(`/ohe-tracking/${id}`)
            await fetchTrackings()
        } catch (err) {
            console.error(err)
        }
    }

    // ตรวจสอบว่า step 5 (เสนอ สป.อว.) เป็น current หรือ done แล้วหรือยัง
    const canRecord = steps.some(
        s => s.step_order === 5 && (s.status === 'current' || s.status === 'done')
    )

    return (
        <div className="mt-4">
            {/* Section Header */}
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <History size={12} className="text-violet-500" />
                    <p className="text-sm font-semibold text-gray-700">
                        สถานะการส่ง อว. ({trackings.length} รายการ)
                    </p>
                </div>
                {isOfficer && !showForm && (
                    <button
                        onClick={() => {
                            if (!canRecord) return
                            resetForm(); setShowForm(true)
                        }}
                        disabled={!canRecord}
                        title={!canRecord ? 'บันทึกได้เมื่อถึงขั้นตอน เสนอ สป.อว. แล้ว' : ''}
                        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition
                            ${canRecord
                                ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                                : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                    >
                        <Plus size={11} /> บันทึกสถานะใหม่
                    </button>
                )}
            </div>

            {/* แสดง warning ถ้ายังไม่ถึง step 5 */}
            {!canRecord && isOfficer && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle size={13} className="shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">
                        บันทึกสถานะ อว. ได้เมื่อหลักสูตรถึงขั้นตอน <span className="font-semibold">"เสนอ สป.อว."</span> แล้วเท่านั้น
                    </p>
                </div>
            )}

            {/* Form inline */}
            {showForm && isOfficer && (
                <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                    <p className="mb-2.5 text-xs font-semibold text-violet-700">
                        {editId ? "แก้ไขสถานะ อว." : "บันทึกสถานะ อว. ใหม่"}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                        {/* ohe_status dropdown */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">สถานะ อว. <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select
                                    value={form.ohe_status}
                                    onChange={e => setForm(p => ({ ...p, ohe_status: e.target.value, custom_status: "" }))}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                >
                                    {OHE_STATUS_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            {/* กรอกเองถ้าเลือก "อื่นๆ" */}
                            {isCustom && (
                                <input
                                    value={form.custom_status}
                                    onChange={e => setForm(p => ({ ...p, custom_status: e.target.value }))}
                                    placeholder="เช่น P/2, S/4..."
                                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                />
                            )}
                        </div>

                        {/* วันที่ส่ง */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">วันที่ส่ง/บันทึก</label>
                            <input
                                type="date"
                                value={form.submitted_date}
                                onChange={e => setForm(p => ({ ...p, submitted_date: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                            />
                        </div>

                        {/* หมายเหตุ */}
                        <div className="col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
                            <textarea
                                rows={2}
                                value={form.note}
                                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="mt-2.5 flex justify-end gap-2">
                        <button onClick={resetForm} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !finalStatus.trim()}
                            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                            {saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "บันทึก"}
                        </button>
                    </div>
                </div>
            )}

            {/* Tracking list */}
            {loading ? (
                <p className="text-xs text-gray-400 py-2">กำลังโหลด...</p>
            ) : trackings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
                    ยังไม่มีการบันทึกสถานะ อว.
                </div>
            ) : (
                <div className="space-y-2">
                    {trackings.map((t, i) => (
                        <div key={t.tracking_id} className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5">
                            {/* ลำดับ */}
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                                {trackings.length - i}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <OheBadge status={t.ohe_status} />
                                    {t.submitted_date && (
                                        <span className="text-xs text-gray-400">{formatDate(t.submitted_date)}</span>
                                    )}
                                    {t.users && (
                                        <span className="text-xs text-gray-400">
                                            โดย {t.users.first_name} {t.users.last_name}
                                        </span>
                                    )}
                                </div>
                                {t.note && (
                                    <p className="mt-1 text-xs text-gray-500 leading-4">{t.note}</p>
                                )}
                                <p className="mt-0.5 text-xs text-gray-300">{formatDate(t.created_at)}</p>
                            </div>
                            {/* actions */}
                            {isOfficer && (
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        onClick={() => handleEdit(t)}
                                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-500"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.tracking_id)}
                                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Main Component ──────────────────────────────────────────────────────────
const CourseDetailModal = ({ open, onClose, course, setSelectedCourse }) => {
    if (!open || !course) return null;

    const { role } = useAuth();
    const isOfficer = role === "officer";
    const steps = course.curriculumProcesses || [];

    const [rejectingId, setRejectingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [reasonError, setReasonError] = useState(false);
    const [confirmStep, setConfirmStep] = useState(null);
    const [undoToast, setUndoToast] = useState(null);
    const [undoCountdown, setUndoCountdown] = useState(5);
    const undoTimerRef = useRef(null);

    const completed = steps.filter(s => s.status === "done").length;
    const percent = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

    useEffect(() => () => { clearInterval(undoTimerRef.current); }, []);

    const statusText = (status) => {
        switch (status) {
            case "done": return "ผ่าน";
            case "current": return "อยู่ระหว่างดำเนินการ";
            case "rejected": return "ส่งกลับแก้ไข";
            case "resubmitted": return "ส่งกลับเข้าพิจารณา";
            default: return "รอดำเนินการ";
        }
    };

    const currentStep = steps.find(s => s.status === "current") || null;

    const refreshCourse = async () => {
        const res = await api.get(`/courses/${course.curriculum_id}`);
        setSelectedCourse(res.data.data);
    };

    const updateProcessStatus = async (processId, status, note = "") => {
        try {
            await api.put(`/curriculum-process/${processId}`, { status, note });
            await refreshCourse();
            setRejectingId(null);
            setRejectReason("");
            setReasonError(false);
        } catch (err) { console.error(err); }
    };

    const handleApproveClick = (step) => setConfirmStep({ process_id: step.process_id, step_name: step.step_name });

    const handleConfirmApprove = async () => {
        const { process_id, step_name } = confirmStep;
        setConfirmStep(null);
        await updateProcessStatus(process_id, "done");
        setUndoToast({ process_id, step_name });
        setUndoCountdown(5);
        undoTimerRef.current = setInterval(() => {
            setUndoCountdown(c => {
                if (c <= 1) { clearInterval(undoTimerRef.current); setUndoToast(null); return 5; }
                return c - 1;
            });
        }, 1000);
    };

    const handleUndo = async () => {
        clearInterval(undoTimerRef.current);
        const { process_id } = undoToast;
        setUndoToast(null);
        setUndoCountdown(5);
        await updateProcessStatus(process_id, "current");
    };

    const handleRejectSubmit = (processId) => {
        if (!rejectReason.trim()) { setReasonError(true); return; }
        setReasonError(false);
        updateProcessStatus(processId, "rejected", rejectReason);
    };

    const getCircleStyle = (s) => ({ done: "border-2 border-green-500 bg-white text-green-500", current: "border-2 border-blue-400 bg-white text-blue-400", rejected: "border-2 border-red-400 bg-white text-red-400", resubmitted: "border-2 border-amber-400 bg-white text-amber-400" }[s] || "border-2 border-gray-300 bg-white text-gray-300");
    const getLineColor = (s) => ({ done: "bg-green-300", current: "bg-blue-200", rejected: "bg-red-200", resubmitted: "bg-amber-200" }[s] || "bg-gray-200");
    const getCardStyle = (s) => ({ done: "border border-gray-100 bg-white", current: "border border-blue-200 bg-blue-50/70", rejected: "border border-red-100 bg-red-50/60", resubmitted: "border border-amber-100 bg-amber-50/50" }[s] || "border border-gray-100 bg-gray-50/50");
    const getBadgeStyle = (s) => ({ done: "bg-green-100 text-green-700", current: "bg-blue-100 text-blue-700", rejected: "bg-red-100 text-red-700", resubmitted: "bg-amber-100 text-amber-700" }[s] || "bg-gray-100 text-gray-500");

    const StepIcon = ({ status }) => {
        switch (status) {
            case "done": return <CheckCircle2 size={13} />;
            case "current": return <Clock3 size={13} />;
            case "rejected": return <XCircle size={13} />;
            case "resubmitted": return <RotateCcw size={13} />;
            default: return <Clock3 size={13} />;
        }
    };

    return (
        <>
            <ConfirmDialog open={!!confirmStep} stepName={confirmStep?.step_name || ""} onConfirm={handleConfirmApprove} onCancel={() => setConfirmStep(null)} />
            <UndoToast visible={!!undoToast} stepName={undoToast?.step_name || ""} countdown={undoCountdown} onUndo={handleUndo} />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="w-full overflow-hidden rounded-xl bg-white shadow-2xl" style={{ maxWidth: "720px", maxHeight: "90vh" }}>

                    {/* HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">รายละเอียดและติดตามสถานะหลักสูตร</h2>
                            <p className="text-xs text-gray-400">ดูข้อมูลหลักสูตรและบันทึกการพิจารณาแต่ละขั้นตอน</p>
                        </div>
                        <button onClick={onClose} className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100">
                            <X size={13} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(90vh - 56px)" }}>

                        {/* TOP INFO CARD */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 leading-snug">{course.curriculum_name_th}</h3>
                                    <p className="text-xs text-gray-400">{course.curriculum_name_en}</p>
                                </div>
                                {currentStep && (
                                    <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                        {currentStep.step_name}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                                <InfoRow label="รหัส:" value={course.curriculum_code || "-"} />
                                <InfoRow label="ประเภท:" value={PROGRAM_TYPE_LABEL[course.program_type] || "-"} />
                                <InfoRow label="ระดับ:" value={EDU_LEVEL_LABEL[course.education_level] || "-"} />
                                <InfoRow label="คณะ:" value={course.departments?.faculties?.faculty_name_th || "-"} />
                                <InfoRow label="สาขา:" value={course.departments?.department_name_th || "-"} />
                                <InfoRow label="หน่วยกิต:" value={course.total_credits ?? "-"} />
                                <InfoRow label="ปีเริ่มใช้:" value={course.start_use_year ?? "-"} />
                                <InfoRow label="ปีสิ้นสุด:" value={course.end_year ?? "-"} />
                                <InfoRow label="โครงการ:" value={course.program_flag || "-"} />
                            </div>
                            <div className="mt-3">
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="mt-0.5 flex justify-end">
                                    <span className="text-xs text-gray-400">{percent}%</span>
                                </div>
                            </div>
                        </div>

                        {/* STEP SECTION */}
                        <div className="mt-4 mb-2 flex items-center gap-1.5">
                            <ArrowRight size={12} className="text-green-600" strokeWidth={2.5} />
                            <p className="text-sm font-semibold text-gray-700">
                                ขั้นตอนการพัฒนาหลักสูตร ({completed}/{steps.length} ขั้นตอน)
                            </p>
                        </div>

                        {/* STEP LIST */}
                        <div>
                            {steps.map((step, index) => {
                                const isCurrent = step.status === "current";
                                const isRejected = step.status === "rejected";
                                return (
                                    <div key={step.process_id} className="relative flex gap-2.5">
                                        <div className="flex flex-col items-center" style={{ minWidth: "28px" }}>
                                            <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${getCircleStyle(step.status)}`}>
                                                <StepIcon status={step.status} />
                                            </div>
                                            {index !== steps.length - 1 && (
                                                <div className={`w-0.5 flex-1 ${getLineColor(step.status)}`} style={{ minHeight: "12px" }} />
                                            )}
                                        </div>
                                        <div className={`mb-2 flex-1 rounded-xl p-3 ${getCardStyle(step.status)}`}>
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    ขั้นตอนที่ {step.step_order}: {step.step_name}
                                                </p>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBadgeStyle(step.status)}`}>
                                                    {statusText(step.status)}
                                                </span>
                                            </div>
                                            {step.process_date && (
                                                <p className="mt-0.5 text-xs text-gray-400">วันที่: {step.process_date?.split("T")[0]}</p>
                                            )}
                                            {step.note && (
                                                <div className="mt-2 rounded-lg border border-red-100 bg-white p-2.5">
                                                    <div className="flex items-start gap-1.5">
                                                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-red-100">
                                                            <MessageCircleMore size={10} className="text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-red-600">เหตุผลที่ส่งกลับแก้ไข</p>
                                                            <p className="mt-0.5 text-xs leading-4 text-gray-600">{step.note}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {isCurrent && isOfficer && (
                                                <div className="mt-2.5 flex gap-2">
                                                    <button onClick={() => handleApproveClick(step)}
                                                        className="flex items-center gap-1 rounded-full border border-green-500 bg-white px-3.5 py-1 text-xs font-semibold text-green-600 transition hover:bg-green-50">
                                                        <CheckCircle2 size={11} className="text-green-500" /> ผ่าน
                                                    </button>
                                                    <button onClick={() => { setRejectingId(step.process_id); setReasonError(false); setRejectReason(""); }}
                                                        className="flex items-center gap-1 rounded-full border border-red-400 bg-white px-3.5 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50">
                                                        <XCircle size={11} className="text-red-400" /> ไม่ผ่าน
                                                    </button>
                                                </div>
                                            )}
                                            {rejectingId === step.process_id && isOfficer && (
                                                <div className="mt-2 rounded-lg border border-red-200 bg-white p-3">
                                                    <p className="mb-1.5 text-xs font-semibold text-red-600">ระบุเหตุผลที่ส่งกลับแก้ไข</p>
                                                    <textarea rows={3} value={rejectReason}
                                                        onChange={e => { setRejectReason(e.target.value); if (e.target.value.trim()) setReasonError(false); }}
                                                        placeholder="กรอกเหตุผล..."
                                                        className={`w-full resize-none rounded-lg border bg-gray-50 p-2.5 text-xs outline-none transition focus:bg-white ${reasonError ? "border-red-400" : "border-gray-200 focus:border-red-400"}`}
                                                    />
                                                    {reasonError && (
                                                        <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                                                            <AlertCircle size={11} /> กรุณาระบุเหตุผลก่อนบันทึก
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex justify-end gap-2">
                                                        <button onClick={() => { setRejectingId(null); setRejectReason(""); setReasonError(false); }}
                                                            className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                                                        <button onClick={() => handleRejectSubmit(step.process_id)}
                                                            className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600">บันทึกเหตุผล</button>
                                                    </div>
                                                </div>
                                            )}
                                            {isRejected && isOfficer && (
                                                <div className="mt-2">
                                                    <button onClick={() => updateProcessStatus(step.process_id, "resubmitted")}
                                                        className="flex items-center gap-1 rounded-full border border-blue-400 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50">
                                                        <RotateCcw size={11} /> ส่งกลับเข้าพิจารณา
                                                    </button>
                                                </div>

                                            )}
                                            {/* แนบไฟล์ มคอ.2 (step 1) หรือ สมอ.08 (step 5) */}
                                            <StepFileAttach
                                                step={step}
                                                isOfficer={isOfficer}
                                                onRefresh={refreshCourse}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ OHE TRACKING SECTION */}
                        <div className="mt-2 border-t border-gray-100 pt-4">
                            <OheTrackingSection
                                curriculumId={course.curriculum_id}
                                isOfficer={isOfficer}
                                steps={steps}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex items-baseline gap-1 min-w-0">
        <span className="shrink-0 text-gray-400">{label}</span>
        <span className="truncate font-medium text-gray-700">{value}</span>
    </div>
);

export default CourseDetailModal;