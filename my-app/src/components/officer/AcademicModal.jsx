import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";

const ROLES = [
    "ประธานสภาวิชาการ",
    "รองประธาน",
    "กรรมการ",
    "กรรมการและเลขานุการ",
    "ผู้ทรงคุณวุฒิ",
];

const emptyForm = {
    teacher_id: "",
    role: "",
    duty: "",
    appointed_date: "",
    end_date: "",
    is_active: true,
};

const AcademicModal = ({ open, onClose, onSave, editData, teachers = [] }) => {
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (editData) {
            setForm({
                teacher_id: String(editData.teacher_id || ""),
                role: editData.role || "",
                duty: editData.duty || "",
                appointed_date: editData.appointed_date?.split("T")[0] || "",
                end_date: editData.end_date?.split("T")[0] || "",
                is_active: editData.is_active ?? true,
            });
        } else {
            setForm(emptyForm);
        }
    }, [editData, open]);

    if (!open) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
    const selectClass = `${inputClass} appearance-none`;

    // หาอาจารย์ที่เลือกอยู่ เพื่อแสดงรูป
    const selectedTeacher = teachers.find(
        (t) => String(t.teacher_id) === String(form.teacher_id)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editData ? "แก้ไขกรรมการวิชาการ" : "เพิ่มกรรมการวิชาการ"}
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">กำหนดบทบาทและหน้าที่</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-7 py-5 space-y-4">

                    {/* แสดงรูปอาจารย์ที่เลือก */}
                    {selectedTeacher && (
                        <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                            {selectedTeacher.profile_image ? (
                                <img
                                    src={`http://localhost:3000${selectedTeacher.profile_image}`}
                                    alt="profile"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {selectedTeacher.first_name_th?.[0]}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {selectedTeacher.title_name}{selectedTeacher.first_name_th} {selectedTeacher.last_name_th}
                                </p>
                                <p className="text-xs text-gray-500">{selectedTeacher.academic_position}</p>
                            </div>
                        </div>
                    )}

                    {/* เลือกอาจารย์ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            อาจารย์ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                name="teacher_id"
                                value={form.teacher_id}
                                onChange={handleChange}
                                className={selectClass}
                            >
                                <option value="">-- เลือกอาจารย์ --</option>
                                {teachers.map((t) => (
                                    <option key={t.teacher_id} value={t.teacher_id}>
                                        {t.title_name}{t.first_name_th} {t.last_name_th}
                                        {t.academic_position ? ` (${t.academic_position})` : ""}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* บทบาท */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            บทบาท <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className={selectClass}
                            >
                                <option value="">-- เลือกบทบาท --</option>
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* หน้าที่ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            หน้าที่
                        </label>
                        <textarea
                            name="duty"
                            value={form.duty}
                            onChange={handleChange}
                            placeholder="ระบุหน้าที่ความรับผิดชอบ"
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* วันที่ */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                วันที่แต่งตั้ง
                            </label>
                            <input
                                type="date"
                                name="appointed_date"
                                value={form.appointed_date}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                วันที่สิ้นสุด
                            </label>
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* สถานะ */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={form.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            ยังดำรงตำแหน่งอยู่
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-7 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition font-medium"
                    >
                        {editData ? "บันทึกการแก้ไข" : "เพิ่มกรรมการ"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AcademicModal;