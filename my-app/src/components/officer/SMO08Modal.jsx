import { X, Upload, FileText, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
    curriculum_id: "",
    faculty: "",
    major: "",
    improveRound: "",
    year: "",
    approveDate: "",
    startTerm: "",
    startYear: "",
    reason: "",
    oldStructure: "",
    newStructure: "",
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
                improveRound: editData.improve_round || "",
                year: editData.year || "",
                approveDate: editData.approve_date?.split("T")[0] || "",
                startTerm: editData.start_term || "",
                startYear: editData.start_year || "",
                reason: editData.reason || "",
                oldStructure: editData.old_structure || "",
                newStructure: editData.new_structure || "",
                file: null,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editData, open]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };
    // เพิ่ม handler พิเศษสำหรับ dropdown หลักสูตร
    const handleCurriculumChange = (e) => {
        const selectedId = Number(e.target.value);
        const selected = curriculums.find(c => c.curriculum_id === selectedId);

        setForm((prev) => ({
            ...prev,
            curriculum_id: e.target.value,
            // autofill คณะและสาขาจากหลักสูตรที่เลือก
            faculty: selected?.departments?.faculties?.faculty_name_th || prev.faculty,
            major: selected?.departments?.department_name_th || prev.major,
        }));
    };
    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editData ? "แก้ไขเอกสาร สมอ.08" : "เพิ่มเอกสาร สมอ.08"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">กรอกข้อมูลเอกสาร สมอ.08</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

                    {/* หลักสูตร */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            หลักสูตร <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                name="curriculum_id"
                                value={form.curriculum_id}
                                onChange={handleCurriculumChange}  // ✅ เปลี่ยนตรงนี้
                                className={`${inputClass} appearance-none pr-10`}
                            >
                                <option value="">-- กรุณาเลือกหลักสูตร --</option>
                                {curriculums.map((c) => (
                                    <option key={c.curriculum_id} value={c.curriculum_id}>
                                        {c.curriculum_name_th}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* คณะ / สาขา */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            คณะ / สาขา
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                name="faculty"
                                value={form.faculty}
                                readOnly
                                className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                            />
                            <input
                                name="major"
                                value={form.major}
                                readOnly
                                className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                            />
                        </div>
                    </div>

                    {/* ข้อมูลการปรับปรุง */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ข้อมูลการปรับปรุง
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <input name="improveRound" value={form.improveRound} onChange={handleChange} placeholder="รอบการปรับปรุง" className={inputClass} />
                            <input name="year" value={form.year} onChange={handleChange} placeholder="ปี พ.ศ." className={inputClass} />
                            <input type="date" name="approveDate" value={form.approveDate} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>

                    {/* กำหนดการเริ่มใช้ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            กำหนดการเริ่มใช้
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input name="startTerm" value={form.startTerm} onChange={handleChange} placeholder="ภาคเรียน" className={inputClass} />
                            <input name="startYear" value={form.startYear} onChange={handleChange} placeholder="ปีการศึกษา" className={inputClass} />
                        </div>
                    </div>

                    {/* เหตุผลและโครงสร้าง */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            เหตุผลในการปรับปรุง
                        </label>
                        <input name="reason" value={form.reason} onChange={handleChange} placeholder="ระบุเหตุผล" className={inputClass} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            โครงสร้าง
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input name="oldStructure" value={form.oldStructure} onChange={handleChange} placeholder="โครงสร้างเดิม" className={inputClass} />
                            <input name="newStructure" value={form.newStructure} onChange={handleChange} placeholder="โครงสร้างใหม่" className={inputClass} />
                        </div>
                    </div>

                    {/* ไฟล์ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            อัปโหลดไฟล์เอกสาร
                        </label>
                        <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition group">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition flex-shrink-0">
                                <Upload className="text-blue-500" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์</p>
                                <p className="text-xs text-gray-400 mt-0.5">รองรับ PDF, DOC, DOCX</p>
                            </div>
                            <input type="file" name="file" accept=".pdf,.doc,.docx" onChange={handleChange} className="hidden" />
                        </label>

                        {/* แสดงไฟล์ที่เลือก */}
                        {form.file && form.file instanceof File && (
                            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{form.file.name}</span>
                            </div>
                        )}

                        {/* แสดงไฟล์เดิม (กรณีแก้ไข) */}
                        {editData?.file_path && !form.file && (
                            <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-500 truncate">
                                    ไฟล์เดิม: {editData.file_path.split("/").pop()}
                                </span>
                                <a
                                    href={`${import.meta.env.VITE_API_URL}${editData.file_path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-auto text-xs text-blue-500 underline flex-shrink-0"
                                >
                                    ดูไฟล์
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                        {editData ? "บันทึกการแก้ไข" : "เพิ่มเอกสาร"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SMO08Modal;