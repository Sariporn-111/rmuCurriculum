import { X, Upload, FileText, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
    curriculum_id: "",
    faculty: "",
    major: "",
    note: "",
    file: null,
};

const SMO08Modal = ({ open, onClose, onSave, editData, curriculums = [] }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (editData) {
            setForm({
                curriculum_id: editData.curriculum_id || "",
                faculty: editData.faculty || "",
                major: editData.major || "",
                note: editData.note || "",
                file: null,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editData, open]);

    if (!open) return null;

    const handleCurriculumChange = (e) => {
        const selectedId = Number(e.target.value);
        const selected = curriculums.find(c => c.curriculum_id === selectedId);
        setForm(prev => ({
            ...prev,
            curriculum_id: e.target.value,
            faculty: selected?.departments?.faculties?.faculty_name_th || "",
            major: selected?.departments?.department_name_th || "",
        }));
    };

    const handleFile = (e) => {
        setForm(prev => ({ ...prev, file: e.target.files?.[0] || null }));
    };

    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white";
    const readOnlyClass = "w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed outline-none";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {editData ? "แก้ไขเอกสาร สมอ.08" : "เพิ่มเอกสาร สมอ.08"}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">เลือกหลักสูตรและอัปโหลดไฟล์เอกสาร</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-5 space-y-4">

                    {/* หลักสูตร */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            หลักสูตร <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={form.curriculum_id}
                                onChange={handleCurriculumChange}
                                className={`${inputClass} appearance-none pr-10`}
                            >
                                <option value="">-- กรุณาเลือกหลักสูตร --</option>
                                {curriculums.map(c => (
                                    <option key={c.curriculum_id} value={c.curriculum_id}>
                                        {c.curriculum_name_th}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* คณะ และ สาขา (แสดงอัตโนมัติ) */}
                    {form.curriculum_id && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">คณะ</label>
                                <input value={form.faculty} readOnly className={readOnlyClass} placeholder="—" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">สาขา</label>
                                <input value={form.major} readOnly className={readOnlyClass} placeholder="—" />
                            </div>
                        </div>
                    )}

                    {/* อัปโหลดไฟล์ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ไฟล์เอกสาร สมอ.08
                        </label>
                        <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition group">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition shrink-0">
                                <Upload className="text-blue-500" size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์</p>
                                <p className="text-xs text-gray-400 mt-0.5">รองรับ PDF, DOC, DOCX</p>
                            </div>
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFile} className="hidden" />
                        </label>

                        {/* ไฟล์ที่เลือกใหม่ */}
                        {form.file instanceof File && (
                            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <FileText size={15} className="text-blue-500 shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{form.file.name}</span>
                            </div>
                        )}

                        {/* ไฟล์เดิม (กรณีแก้ไข) */}
                        {editData?.file_path && !(form.file instanceof File) && (
                            <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                <FileText size={15} className="text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-500 truncate">
                                    ไฟล์เดิม: {editData.file_path.split("/").pop()}
                                </span>
                                <a href={`${import.meta.env.VITE_API_URL}${editData.file_path}`}
                                    target="_blank" rel="noreferrer"
                                    className="ml-auto text-xs text-blue-500 underline shrink-0">
                                    ดูไฟล์
                                </a>
                            </div>
                        )}
                    </div>

                    {/* หมายเหตุ (ไม่บังคับ) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            หมายเหตุ
                            <span className="ml-1 text-xs font-normal text-gray-400">(ไม่บังคับ)</span>
                        </label>
                        <textarea
                            value={form.note}
                            onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                            rows={2}
                            placeholder="บันทึกข้อมูลเพิ่มเติม..."
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* แจ้งเตือนว่าข้อมูลวิชาการให้อาจารย์กรอก */}
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                        <p className="text-xs text-amber-700 font-medium">
                            ข้อมูลวิชาการ เช่น รอบการปรับปรุง เหตุผล โครงสร้างหลักสูตร
                            จะให้อาจารย์ผู้รับผิดชอบหลักสูตรเป็นผู้กรอกในระบบ
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-7 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition font-medium">
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={!form.curriculum_id}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                        {editData ? "บันทึกการแก้ไข" : "เพิ่มเอกสาร"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SMO08Modal;