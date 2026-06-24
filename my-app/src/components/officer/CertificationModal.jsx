import { X, Upload, FileText, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AGENCIES = ["ก.พ.", "ก.พ.ศ.", "อื่น ๆ"];

const CERT_TYPES = [
    "การรับรองคุณวุฒิ",
    "การรับรองมาตรฐาน",
    "การรับรองสาขา",
    "อื่น ๆ",
];

const emptyForm = {
    curriculum_id: "",
    certification_type: "",
    agency: "",
    agency_custom: "",
    doc_number: "",
    issue_date: "",
    received_date: "",
    note: "",
    file: null,
    existingFile: "",
};

const CertificationModal = ({
    open,
    onClose,
    onSave,
    editData,
    curriculums = [],
}) => {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        if (editData) {
            const isCustom =
                editData.agency &&
                !AGENCIES.slice(0, -1).includes(editData.agency);

            setForm({
                curriculum_id: editData.curriculum_id || "",
                certification_type: editData.certification_type || "",
                agency: isCustom ? "อื่น ๆ" : (editData.agency || ""),
                agency_custom: isCustom ? editData.agency : "",
                doc_number: editData.doc_number || "",
                issue_date: editData.issue_date?.split("T")[0] || "",
                received_date: editData.received_date?.split("T")[0] || "",
                note: editData.note || "",
                file: null,
                existingFile: editData.file_path || "",
            });
        } else {
            setForm(emptyForm);
        }

        setErrors({});
    }, [editData, open]);

    if (!open) return null;

    /* ── helpers ── */
    const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
    const clearErr = (...keys) =>
        setErrors((p) => {
            const n = { ...p };
            keys.forEach((k) => delete n[k]);
            return n;
        });

    const validate = () => {
        const e = {};
        if (!form.curriculum_id) e.curriculum_id = "กรุณาเลือกหลักสูตร";
        if (!form.certification_type) e.certification_type = "กรุณาเลือกประเภทการรับรอง";
        if (!form.agency) e.agency = "กรุณาเลือกหน่วยงาน";
        if (form.agency === "อื่น ๆ" && !form.agency_custom.trim())
            e.agency_custom = "กรุณาระบุชื่อหน่วยงาน";
        if (!form.doc_number.trim()) e.doc_number = "กรุณาระบุเลขที่เอกสาร";
        if (!form.issue_date) e.issue_date = "กรุณาระบุวันที่ออกหนังสือ";
        return e;
    };

    const handleSubmit = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }

        onSave({
            ...form,
            agency:
                form.agency === "อื่น ๆ"
                    ? form.agency_custom.trim()
                    : form.agency,
        });
    };

    /* ── drag & drop ── */
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === "application/pdf") set("file", f);
    };

    /* ── style shortcuts ── */
    const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
    const inputCls = (k) =>
        `w-full rounded-xl border ${errors[k]
            ? "border-red-400 bg-red-50"
            : "border-gray-200 bg-white"
        } px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent`;
    const ErrMsg = ({ k }) =>
        errors[k] ? (
            <p className="mt-1 text-xs text-red-500">{errors[k]}</p>
        ) : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editData ? "แก้ไขเอกสารรับรอง" : "เพิ่มเอกสารรับรองใหม่"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            กรอกข้อมูลการรับรองคุณวุฒิหลักสูตร
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

                    {/* หลักสูตร */}
                    <div>
                        <label className={labelCls}>
                            หลักสูตร <Req />
                        </label>
                        <select
                            value={form.curriculum_id}
                            onChange={(e) => { set("curriculum_id", e.target.value); clearErr("curriculum_id"); }}
                            className={inputCls("curriculum_id")}
                        >
                            <option value="">-- กรุณาเลือกหลักสูตร --</option>
                            {curriculums.map((c) => (
                                <option key={c.curriculum_id} value={c.curriculum_id}>
                                    {c.curriculum_name_th}
                                </option>
                            ))}
                        </select>
                        <ErrMsg k="curriculum_id" />
                    </div>

                    {/* ประเภทการรับรอง */}
                    <div>
                        <label className={labelCls}>
                            ประเภทการรับรอง <Req />
                        </label>
                        <select
                            value={form.certification_type}
                            onChange={(e) => { set("certification_type", e.target.value); clearErr("certification_type"); }}
                            className={inputCls("certification_type")}
                        >
                            <option value="">-- เลือกประเภท --</option>
                            {CERT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <ErrMsg k="certification_type" />
                    </div>

                    {/* หน่วยงานที่รับรอง */}
                    <div>
                        <label className={labelCls}>
                            หน่วยงานที่รับรอง <Req />
                        </label>
                        <select
                            value={form.agency}
                            onChange={(e) => {
                                set("agency", e.target.value);
                                if (e.target.value !== "อื่น ๆ") set("agency_custom", "");
                                clearErr("agency", "agency_custom");
                            }}
                            className={inputCls("agency")}
                        >
                            <option value="">-- เลือกหน่วยงาน --</option>
                            {AGENCIES.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <ErrMsg k="agency" />

                        {form.agency === "อื่น ๆ" && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={form.agency_custom}
                                    onChange={(e) => { set("agency_custom", e.target.value); clearErr("agency_custom"); }}
                                    placeholder="ระบุชื่อหน่วยงาน..."
                                    className={inputCls("agency_custom")}
                                />
                                <ErrMsg k="agency_custom" />
                            </div>
                        )}
                    </div>

                    {/* เลขที่เอกสาร */}
                    <div>
                        <label className={labelCls}>
                            เลขที่หนังสือรับรอง / เลขที่เอกสารอ้างอิง <Req />
                        </label>
                        <input
                            type="text"
                            value={form.doc_number}
                            onChange={(e) => { set("doc_number", e.target.value); clearErr("doc_number"); }}
                            placeholder="เช่น กศ 0507/3812"
                            className={inputCls("doc_number")}
                        />
                        <ErrMsg k="doc_number" />
                    </div>

                    {/* วันที่ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>
                                วันที่ออกหนังสือรับรอง <Req />
                            </label>
                            <input
                                type="date"
                                value={form.issue_date}
                                onChange={(e) => { set("issue_date", e.target.value); clearErr("issue_date"); }}
                                className={inputCls("issue_date")}
                            />
                            <ErrMsg k="issue_date" />
                        </div>

                        <div>
                            <label className={labelCls}>
                                วันที่ได้รับเอกสาร
                                <span className="ml-1 text-gray-400 font-normal">(ถ้ามี)</span>
                            </label>
                            <input
                                type="date"
                                value={form.received_date}
                                onChange={(e) => set("received_date", e.target.value)}
                                className={inputCls("received_date")}
                            />
                        </div>
                    </div>

                    {/* หมายเหตุ */}
                    <div>
                        <label className={labelCls}>
                            หมายเหตุเพิ่มเติม
                            <span className="ml-1 text-gray-400 font-normal">(ไม่บังคับ)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.note}
                            onChange={(e) => set("note", e.target.value)}
                            placeholder="บันทึกข้อมูลเพิ่มเติม..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 resize-none outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* ไฟล์ PDF */}
                    <div>
                        <label className={labelCls}>ไฟล์เอกสารรับรอง (PDF)</label>

                        {form.file ? (
                            /* ไฟล์ใหม่ที่เลือก */
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <FileText size={15} />
                                    </div>
                                    <div>
                                        <p className="max-w-[280px] truncate text-xs font-medium text-gray-800">
                                            {form.file.name}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {(form.file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => set("file", null)}
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-emerald-100 hover:text-red-500"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                        ) : form.existingFile ? (
                            /* ไฟล์เดิม (edit mode) */
                            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                        <FileText size={15} />
                                    </div>
                                    <div>
                                        <p className="max-w-[220px] truncate text-xs font-medium text-gray-800">
                                            {decodeURIComponent(form.existingFile.split("/").pop())}
                                        </p>
                                        <p className="text-[11px] text-gray-400">ไฟล์เดิม</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`http://localhost:3000${form.existingFile}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 underline"
                                    >
                                        ดูไฟล์
                                    </a>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        onClick={() => set("existingFile", "")}
                                        className="text-xs text-red-400 hover:text-red-600 transition"
                                    >
                                        เปลี่ยนไฟล์
                                    </button>
                                </div>
                            </div>

                        ) : (
                            /* drop zone */
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition ${dragOver
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                                    }`}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-blue-500">
                                    <Upload size={18} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        คลิกหรือลากไฟล์มาวางที่นี่
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">รองรับเฉพาะไฟล์ PDF</p>
                                </div>
                            </div>
                        )}

                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files[0];
                                if (f) { set("file", f); set("existingFile", ""); }
                                e.target.value = "";
                            }}
                        />
                    </div>

                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                        {editData ? "บันทึกการแก้ไข" : "เพิ่มเอกสารรับรอง"}
                    </button>
                </div>

            </div>
        </div>
    );
};

const Req = () => <span className="text-red-500 ml-0.5">*</span>;

export default CertificationModal;