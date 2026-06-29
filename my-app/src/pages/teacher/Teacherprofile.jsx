import { useState, useEffect, useRef } from "react";
import { TeacherLayout } from "../../components/teacher/TeacherLayout";
import { Camera, Save, KeyRound, User, GraduationCap, Phone, Copy, BookOpen } from "lucide-react";
import api from "../../services/api";
import Swal from "sweetalert2";

const TITLES = ["นาย", "นาง", "นางสาว", "ผศ.", "ผศ.ดร.", "รศ.", "รศ.ดร.", "อ.", "ดร."];
const POSITIONS = ["อาจารย์", "ผู้ช่วยศาสตราจารย์", "รองศาสตราจารย์", "ศาสตราจารย์"];

// ระดับการศึกษาที่ติดตามประวัติ (ตรงกับ enum EducationLevel ฝั่ง backend)
const DEGREE_LEVELS = [
    { key: "bachelor", label: "ปริญญาตรี" },
    { key: "master", label: "ปริญญาโท" },
    { key: "doctoral", label: "ปริญญาเอก" },
];

const emptyEducation = (level) => ({
    degree_level: level,
    degree_name: "",
    major: "",
    faculty_name: "",
    university_name: "",
    country: "",
    graduation_year: "",
});

const formatPhoneDisplay = (digits) => {
    if (!digits) return "";
    const clean = digits.replace(/\D/g, "");
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
};

export const TeacherProfile = () => {
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");
    const fileRef = useRef(null);

    const [personalForm, setPersonalForm] = useState({
        title_name: "", first_name_th: "", last_name_th: "",
        first_name_en: "", last_name_en: "", email: "", phone: "", remark: "",
    });

    const [academicForm, setAcademicForm] = useState({
        academic_position: "", administrative_position: "",
        employment_type: "",
    });

    const [educationForm, setEducationForm] = useState(
        DEGREE_LEVELS.map(d => emptyEducation(d.key))
    );
    const [savingEducation, setSavingEducation] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        current_password: "", new_password: "", confirm_password: "",
    });

    useEffect(() => { fetchProfile(); fetchEducation(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get("/teachers/me");
            const t = res.data.data;
            const email = t.email || t.users?.email || "";
            const phone = t.phone || t.users?.phone || "";

            setTeacher(t);
            setPersonalForm({
                title_name: t.title_name || "",
                first_name_th: t.first_name_th || "",
                last_name_th: t.last_name_th || "",
                first_name_en: t.first_name_en || "",
                last_name_en: t.last_name_en || "",
                email, phone,
                remark: t.remark || "",
            });
            setAcademicForm({
                academic_position: t.academic_position || "",
                administrative_position: t.administrative_position || "",
                employment_type: t.employment_type || "",
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ ดึงประวัติการศึกษาทุกระดับ แล้ว map เข้า 3 ช่อง (ตรี/โท/เอก) ตามลำดับคงที่
    const fetchEducation = async () => {
        try {
            const res = await api.get("/teachers/me/education");
            const records = res.data.data || [];
            setEducationForm(DEGREE_LEVELS.map(({ key }) => {
                const found = records.find(r => r.degree_level === key);
                return found ? {
                    degree_level: key,
                    degree_name: found.degree_name || "",
                    major: found.major || "",
                    faculty_name: found.faculty_name || "",
                    university_name: found.university_name || "",
                    country: found.country || "",
                    graduation_year: found.graduation_year || "",
                } : emptyEducation(key);
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire("แจ้งเตือน", "ขนาดไฟล์ต้องไม่เกิน 2MB", "warning"); return;
        }
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/teachers/me/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
            setTeacher(prev => ({ ...prev, profile_image: res.data.data.profile_image }));
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "อัปโหลดรูปสำเร็จ", showConfirmButton: false, timer: 2000 });
        } catch {
            Swal.fire("ผิดพลาด", "อัปโหลดรูปไม่สำเร็จ", "error");
        }
    };

    const handleSavePersonal = async () => {
        if (personalForm.phone && !/^[0-9]{9,10}$/.test(personalForm.phone)) {
            Swal.fire("แจ้งเตือน", "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9–10 หลัก", "warning"); return;
        }
        try {
            setSaving(true);
            await api.put("/teachers/me", personalForm);
            // อัปเดต state ทันทีโดยไม่ต้อง refetch (ป้องกันข้อมูลถูก overwrite)
            setTeacher(prev => ({ ...prev, ...personalForm }));
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกสำเร็จ", showConfirmButton: false, timer: 2000 });
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSaving(false);
        }
    };

    // ✅ บันทึกข้อมูลวิชาการ — ส่ง academicForm + email/phone จาก personalForm
    //    เพื่อป้องกัน backend เซ็ต email/phone เป็น null
    const handleSaveAcademic = async () => {
        try {
            setSaving(true);
            await api.put("/teachers/me", {
                ...academicForm,
                // ส่ง email/phone ปัจจุบันไปด้วย เพื่อไม่ให้ backend ล้างค่า
                email: personalForm.email,
                phone: personalForm.phone,
            });
            setTeacher(prev => ({ ...prev, ...academicForm }));
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกสำเร็จ", showConfirmButton: false, timer: 2000 });
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSaving(false);
        }
    };

    // ✅ แก้ค่าของฟิลด์ใดฟิลด์หนึ่งในระดับการศึกษาที่ idx (0=ตรี, 1=โท, 2=เอก)
    const updateEducationField = (idx, field, value) => {
        setEducationForm(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    // ✅ บันทึกประวัติการศึกษาทั้ง 3 ระดับในครั้งเดียว (ระดับที่ไม่ได้กรอกชื่อมหาวิทยาลัยจะไม่ถูกบันทึก)
    const handleSaveEducation = async () => {
        try {
            setSavingEducation(true);
            await api.put("/teachers/me/education", { education: educationForm });
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกประวัติการศึกษาสำเร็จ", showConfirmButton: false, timer: 2000 });
            fetchEducation();
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSavingEducation(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.new_password.length < 8) {
            Swal.fire("แจ้งเตือน", "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร", "warning"); return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            Swal.fire("แจ้งเตือน", "รหัสผ่านใหม่ไม่ตรงกัน", "warning"); return;
        }
        try {
            setSaving(true);
            await api.put("/profile/password", {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            Swal.fire("สำเร็จ", "เปลี่ยนรหัสผ่านแล้ว", "success");
            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "เกิดข้อผิดพลาด", "error");
        } finally {
            setSaving(false);
        }
    };

    // ✅ ดึง email/phone จาก teacher state (เก็บไว้ใน teacher.email โดยตรงหลัง fix backend)
    const getEmail = () => teacher?.email || teacher?.users?.email || "-";
    const getPhone = () => teacher?.phone || teacher?.users?.phone || "-";

    const formatDate = (value) => {
        if (!value) return "-";
        try {
            return new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
        } catch {
            return "-";
        }
    };

    const handleCopyEmail = async () => {
        const email = getEmail();
        if (!email || email === "-") return;
        try {
            await navigator.clipboard.writeText(email);
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "คัดลอกอีเมลแล้ว", showConfirmButton: false, timer: 1500 });
        } catch {
            Swal.fire({ toast: true, position: "top-end", icon: "error", title: "คัดลอกไม่สำเร็จ", showConfirmButton: false, timer: 1500 });
        }
    };

    const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-900/30 focus:border-blue-900 bg-white transition";
    const selectClass = `${inputClass} appearance-none`;
    const labelClass = "text-xs font-medium text-gray-500 mb-1.5 block";

    const tabs = [
        { key: "personal", label: "ข้อมูลส่วนตัว", icon: User },
        { key: "academic", label: "ข้อมูลวิชาการ", icon: GraduationCap },
        { key: "education", label: "ประวัติการศึกษา", icon: BookOpen },
        { key: "password", label: "เปลี่ยนรหัสผ่าน", icon: KeyRound },
    ];

    if (loading) return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50/80 animate-pulse">
                <div className="h-36 bg-gradient-to-b from-blue-900 to-blue-950" />
                <div className="px-5 xl:px-8 pb-8">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6 flex flex-col items-center">
                            <div className="h-24 w-24 -mt-12 rounded-2xl bg-gray-300 ring-4 ring-white" />
                            <div className="h-4 w-40 bg-gray-200 rounded mt-4" />
                            <div className="h-3 w-24 bg-gray-200 rounded mt-2" />
                        </div>
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
                            <div className="h-6 w-72 bg-gray-200 rounded" />
                            <div className="h-32 w-full bg-gray-100 rounded mt-6" />
                        </div>
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );

    return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50/80">

                {/* COVER */}
                <div className="relative h-36 bg-gradient-to-b from-blue-900 to-blue-950 text-gray-100 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: "radial-gradient(circle at 15% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 30%, white 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
                </div>

                <div className="px-5 xl:px-8 pb-8">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

                        {/* LEFT: PROFILE CARD */}
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
                            <div className="flex flex-col items-center px-6 pb-5 text-center">
                                <div className="relative -mt-12">
                                    {teacher?.profile_image ? (
                                        <img src={`http://localhost:3000${teacher.profile_image}`} alt="profile"
                                            className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                                    ) : (
                                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-b from-blue-900 to-blue-950 text-gray-100 flex items-center justify-center text-3xl font-bold ring-4 ring-white shadow-xl">
                                            {teacher?.first_name_th?.[0] || "?"}
                                        </div>
                                    )}
                                    <button onClick={() => fileRef.current?.click()}
                                        className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white shadow-md ring-1 ring-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-900 transition">
                                        <Camera size={14} />
                                    </button>
                                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </div>
                                <h1 className="mt-3 text-base font-bold text-gray-900 leading-tight">
                                    {teacher?.title_name}{teacher?.first_name_th} {teacher?.last_name_th}
                                </h1>
                                <p className="text-xs text-gray-400 mt-0.5">{teacher?.academic_position || "อาจารย์"}</p>
                                {teacher?.administrative_position && (
                                    <p className="text-xs font-medium text-blue-900 mt-0.5">{teacher.administrative_position}</p>
                                )}
                            </div>

                            <div className="border-t border-gray-100 px-6 py-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">รหัสพนักงาน</p>
                                    <p className="text-xs font-semibold text-gray-700">{teacher?.employee_code || "-"}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">สถานะ</p>
                                    <p className={`text-xs font-semibold ${teacher?.is_active ? "text-emerald-600" : "text-red-500"}`}>
                                        {teacher?.is_active ? "ปฏิบัติงาน" : "ไม่ปฏิบัติงาน"}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">ลักษณะการจ้าง</p>
                                    <p className="text-xs font-semibold text-gray-700">{teacher?.employment_status || "-"}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">วันเริ่มงาน</p>
                                    <p className="text-xs font-semibold text-gray-700">{formatDate(teacher?.hire_date)}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 px-6 py-4">
                                <p className="text-xs text-gray-400 mb-2">อีเมลติดต่อ</p>
                                <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                                    <span className="text-xs font-medium text-gray-700 truncate">{getEmail()}</span>
                                    <button onClick={handleCopyEmail} title="คัดลอกอีเมล"
                                        className="shrink-0 text-gray-400 hover:text-blue-900 transition">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: TABS + FORM */}
                        <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
                            <div className="flex items-center gap-6 px-6 border-b border-gray-100 overflow-x-auto">
                                {tabs.map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-1.5 py-4 -mb-px border-b-2 text-sm font-medium whitespace-nowrap transition ${activeTab === tab.key
                                            ? "text-blue-900 border-blue-900"
                                            : "text-gray-400 border-transparent hover:text-gray-600"}`}>
                                        <tab.icon size={14} />{tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">

                                {/* ข้อมูลส่วนตัว */}
                                {activeTab === "personal" && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>คำนำหน้า</label>
                                                <select value={personalForm.title_name} onChange={e => setPersonalForm(p => ({ ...p, title_name: e.target.value }))} className={selectClass}>
                                                    <option value="">-- เลือก --</option>
                                                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>ชื่อ (ไทย)</label>
                                                <input value={personalForm.first_name_th} onChange={e => setPersonalForm(p => ({ ...p, first_name_th: e.target.value }))} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>นามสกุล (ไทย)</label>
                                                <input value={personalForm.last_name_th} onChange={e => setPersonalForm(p => ({ ...p, last_name_th: e.target.value }))} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>ชื่อ (อังกฤษ)</label>
                                                <input value={personalForm.first_name_en} onChange={e => setPersonalForm(p => ({ ...p, first_name_en: e.target.value }))} placeholder="First name" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>นามสกุล (อังกฤษ)</label>
                                                <input value={personalForm.last_name_en} onChange={e => setPersonalForm(p => ({ ...p, last_name_en: e.target.value }))} placeholder="Last name" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>เบอร์โทรศัพท์</label>
                                                <input value={formatPhoneDisplay(personalForm.phone || "")} onChange={e => {
                                                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                    setPersonalForm(p => ({ ...p, phone: digits }));
                                                }} placeholder="0XX-XXX-XXXX" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>อีเมล</label>
                                                <input type="email" value={personalForm.email} onChange={e => setPersonalForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>หมายเหตุ</label>
                                            <textarea value={personalForm.remark} onChange={e => setPersonalForm(p => ({ ...p, remark: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
                                        </div>
                                        <div className="pt-2">
                                            <button onClick={handleSavePersonal} disabled={saving}
                                                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 active:scale-95">
                                                <Save size={14} />{saving ? "กำลังบันทึก..." : "บันทึก"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ข้อมูลวิชาการ */}
                                {activeTab === "academic" && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>ตำแหน่งทางวิชาการ</label>
                                                <select value={academicForm.academic_position} onChange={e => setAcademicForm(p => ({ ...p, academic_position: e.target.value }))} className={selectClass}>
                                                    <option value="">-- เลือก --</option>
                                                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>ตำแหน่งทางบริหาร</label>
                                                <input value={academicForm.administrative_position} onChange={e => setAcademicForm(p => ({ ...p, administrative_position: e.target.value }))} placeholder="เช่น หัวหน้าสาขา" className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>ประเภทการจ้าง</label>
                                                <input value={academicForm.employment_type} onChange={e => setAcademicForm(p => ({ ...p, employment_type: e.target.value }))} placeholder="เช่น ข้าราชการ, พนักงานมหาวิทยาลัย" className={inputClass} />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <button onClick={handleSaveAcademic} disabled={saving}
                                                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 active:scale-95">
                                                <Save size={14} />{saving ? "กำลังบันทึก..." : "บันทึก"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ประวัติการศึกษา */}
                                {activeTab === "education" && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-gray-400">กรอกข้อมูลเฉพาะระดับที่จบมาแล้ว ระดับที่ไม่ได้กรอกชื่อมหาวิทยาลัยจะถือว่ายังไม่มีข้อมูล</p>
                                        {DEGREE_LEVELS.map((lvl, idx) => (
                                            <div key={lvl.key} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-900 text-white text-[10px] font-bold">{idx + 1}</span>
                                                    {lvl.label}
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className={labelClass}>ชื่อปริญญา</label>
                                                        <input value={educationForm[idx].degree_name} onChange={e => updateEducationField(idx, "degree_name", e.target.value)} placeholder="เช่น วิทยาศาสตรบัณฑิต" className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>สาขา</label>
                                                        <input value={educationForm[idx].major} onChange={e => updateEducationField(idx, "major", e.target.value)} placeholder="เช่น วิทยาการคอมพิวเตอร์" className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>คณะ</label>
                                                        <input value={educationForm[idx].faculty_name} onChange={e => updateEducationField(idx, "faculty_name", e.target.value)} placeholder="เช่น คณะวิทยาศาสตร์" className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>มหาวิทยาลัย <span className="text-red-400">*</span></label>
                                                        <input value={educationForm[idx].university_name} onChange={e => updateEducationField(idx, "university_name", e.target.value)} placeholder="เช่น มหาวิทยาลัยราชภัฏมหาสารคาม" className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>ประเทศ</label>
                                                        <input value={educationForm[idx].country} onChange={e => updateEducationField(idx, "country", e.target.value)} placeholder="เช่น ไทย" className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>ปีที่จบ (พ.ศ.)</label>
                                                        <input type="number" value={educationForm[idx].graduation_year} onChange={e => updateEducationField(idx, "graduation_year", e.target.value)} placeholder="เช่น 2565" className={inputClass} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <button onClick={handleSaveEducation} disabled={savingEducation}
                                                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 active:scale-95">
                                                <Save size={14} />{savingEducation ? "กำลังบันทึก..." : "บันทึกประวัติการศึกษา"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* เปลี่ยนรหัสผ่าน */}
                                {activeTab === "password" && (
                                    <div className="space-y-4 max-w-md">
                                        {[
                                            { label: "รหัสผ่านปัจจุบัน", key: "current_password", placeholder: "" },
                                            { label: "รหัสผ่านใหม่", key: "new_password", placeholder: "อย่างน้อย 6 ตัวอักษร" },
                                            { label: "ยืนยันรหัสผ่านใหม่", key: "confirm_password", placeholder: "" },
                                        ].map(({ label, key, placeholder }) => (
                                            <div key={key}>
                                                <label className={labelClass}>{label}</label>
                                                <input type="password" value={passwordForm[key]} placeholder={placeholder}
                                                    onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                                                    className={inputClass} />
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <button onClick={handleChangePassword} disabled={saving}
                                                className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 active:scale-95">
                                                <Save size={14} />{saving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
};

export default TeacherProfile;