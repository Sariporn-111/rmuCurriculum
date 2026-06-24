import { X, ChevronDown, Eye, EyeOff, Shuffle, Copy, Check, Link } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/api";

const PREFIXES = [
    "นาย", "นาง", "นางสาว", "ดร.", "ผศ.", "ผศ.ดร.",
    "รศ.", "รศ.ดร.", "ศ.", "ศ.ดร.", "พท.", "พญ.", "ทพ.", "ทพญ.", "อื่นๆ",
];

const formatPhoneDisplay = (digits) => {
    if (!digits) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const TEACHER_ROLE_ID = 3;
const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

export const UserModal = ({
    show, isEdit, form, setForm,
    onClose, onSubmit, roles, loading, errors, setErrors,
}) => {
    const [customPrefix, setCustomPrefix] = useState("");
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [unlinkedTeachers, setUnlinkedTeachers] = useState([]);
    const [linkMode, setLinkMode] = useState("auto");

    useEffect(() => {
        if (show) {
            setErrors({});
            api.get("/faculties")
                .then(res => setFaculties(res.data.data || []))
                .catch(console.error);
        }
    }, [show, setErrors]);

    useEffect(() => {
        if (form.faculty_id) {
            api.get(`/faculties/${form.faculty_id}/departments`)
                .then(res => setDepartments(res.data.data || []))
                .catch(console.error);
        } else {
            setDepartments([]);
        }
    }, [form.faculty_id]);

    useEffect(() => {
        if (show && !isEdit && Number(form.role_id) === TEACHER_ROLE_ID) {
            api.get("/users/unlinked-teachers")
                .then(res => setUnlinkedTeachers(res.data.data || []))
                .catch(console.error);
        } else {
            setUnlinkedTeachers([]);
            setLinkMode("auto");
        }
    }, [show, isEdit, form.role_id]);

    useEffect(() => {
        if (show && !isEdit) {
            setForm({
                prefix: "", firstName: "", lastName: "",
                email: "", phone: "", username: "", password: "",
                role_id: "", status: "active",
                faculty_id: "", department_id: "",
                teacher_id: "",
            });
            setCustomPrefix("");
            setShowPassword(false);
            setLinkMode("auto");
        }
    }, [show, isEdit, setForm]);

    useEffect(() => {
        if (show && isEdit && form.prefix) {
            const isKnown = PREFIXES.slice(0, -1).includes(form.prefix);
            if (!isKnown) {
                setCustomPrefix(form.prefix);
                setForm(prev => ({ ...prev, prefix: "อื่นๆ" }));
            }
        }
    }, [show, isEdit]); // eslint-disable-line

    if (!show) return null;

    const isTeacher = Number(form.role_id) === TEACHER_ROLE_ID;
    const hasUnlinked = unlinkedTeachers.length > 0;

    const handleSelectUnlinked = (e) => {
        const teacherId = e.target.value;
        if (!teacherId) {
            setForm(prev => ({ ...prev, teacher_id: "" }));
            return;
        }

        const t = unlinkedTeachers.find(t => String(t.teacher_id) === String(teacherId));
        if (!t) return;

        // ✅ autofill จากข้อมูล teacher ที่เลือก
        setForm(prev => ({
            ...prev,
            teacher_id: teacherId,
            prefix: t.title_name || prev.prefix,
            firstName: t.first_name_th || prev.firstName,
            lastName: t.last_name_th || prev.lastName,
            email: t.email || prev.email,
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handlePhoneChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
        setForm(prev => ({ ...prev, phone: digits }));
        setErrors(prev => ({ ...prev, phone: "" }));
    };

    const handleFacultyChange = (e) => {
        setForm(prev => ({ ...prev, faculty_id: e.target.value, department_id: "" }));
    };

    const handlePrefixChange = (e) => {
        const val = e.target.value;
        setForm(prev => ({ ...prev, prefix: val }));
        setErrors(prev => ({ ...prev, prefix: "" }));
        if (val !== "อื่นๆ") setCustomPrefix("");
    };

    const handleCustomPrefix = (e) => {
        setCustomPrefix(e.target.value);
        setErrors(prev => ({ ...prev, prefix: "" }));
    };

    const generatePassword = () => {
        const lower = "abcdefghijklmnopqrstuvwxyz";
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const special = "!@#$%^&*-_=+";
        const all = lower + upper + numbers + special;
        const length = 12;
        const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
        let chars = [pick(lower), pick(upper), pick(numbers), pick(special)];
        for (let i = chars.length; i < length; i++) chars.push(pick(all));
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        const password = chars.join("");
        setForm(prev => ({ ...prev, password }));
        setErrors(prev => ({ ...prev, password: "" }));
        setShowPassword(true);
        setCopied(false);
    };

    const handleCopyPassword = async () => {
        if (!form.password) return;
        try {
            await navigator.clipboard.writeText(form.password);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* silent */ }
    };

    const validate = () => {
        const newErrors = {};
        const effectivePrefix = form.prefix === "อื่นๆ" ? customPrefix.trim() : form.prefix;
        if (!effectivePrefix) newErrors.prefix = "กรุณาเลือกหรือกรอกคำนำหน้า";
        if (!form.firstName) newErrors.firstName = "กรุณากรอกชื่อ";
        if (!form.lastName) newErrors.lastName = "กรุณากรอกนามสกุล";
        if (!form.email) newErrors.email = "กรุณากรอกอีเมล";
        if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!form.username) newErrors.username = "กรุณากรอก Username";
        if (!isEdit) {
            if (!form.password) newErrors.password = "กรุณากรอกรหัสผ่าน";
            else if (form.password.length < 8) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
            else if (!SPECIAL_CHARS_REGEX.test(form.password)) newErrors.password = "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว";
        }
        if (!form.role_id) newErrors.role_id = "กรุณาเลือกบทบาท";
        if (form.phone && !/^[0-9]{9,10}$/.test(form.phone)) newErrors.phone = "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก";
        if (isTeacher && linkMode === "manual" && !form.teacher_id)
            newErrors.teacher_id = "กรุณาเลือกอาจารย์ที่ต้องการเชื่อม";
        if (isTeacher && (linkMode === "new" || !hasUnlinked) && !form.department_id)
            newErrors.department_id = "กรุณาเลือกสาขาของอาจารย์";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (linkMode !== "manual") setForm(prev => ({ ...prev, teacher_id: "" }));
        if (form.prefix === "อื่นๆ") {
            setForm(prev => ({ ...prev, prefix: customPrefix.trim() }));
            setTimeout(() => onSubmit(), 0);
        } else {
            onSubmit();
        }
    };

    const inputCls = (field) =>
        `w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${errors[field]
            ? "border-red-400 focus:ring-red-400 bg-red-50"
            : "border-slate-200 focus:ring-blue-400 bg-slate-50 focus:bg-white"
        } transition`;
    const selectCls = (field) => `${inputCls(field)} appearance-none cursor-pointer`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {isEdit ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งาน"}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">กรอกข้อมูลให้ครบถ้วน</p>
                    </div>
                    <button onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-5">

                    {/* ── เชื่อมกับอาจารย์ที่มีอยู่ (เฉพาะ role teacher / สร้างใหม่) ── */}
                    {!isEdit && isTeacher && (
                        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                                <Link size={13} /> เชื่อมกับข้อมูลอาจารย์ในระบบ
                            </p>
                            {!hasUnlinked ? (
                                <p className="text-xs text-blue-600">ไม่มีอาจารย์ที่รอเชื่อมบัญชี ระบบจะสร้างข้อมูลอาจารย์ใหม่อัตโนมัติ</p>
                            ) : (
                                <>
                                    <div className="mb-3 flex gap-2 flex-wrap">
                                        {[
                                            { key: "auto", label: "Match อีเมลอัตโนมัติ" },
                                            { key: "manual", label: "เลือกอาจารย์เอง" },
                                            { key: "new", label: "สร้างข้อมูลใหม่" },
                                        ].map(opt => (
                                            <button key={opt.key} type="button"
                                                onClick={() => { setLinkMode(opt.key); setForm(prev => ({ ...prev, teacher_id: "" })); }}
                                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${linkMode === opt.key
                                                    ? "bg-blue-900 text-white"
                                                    : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-100"}`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {linkMode === "auto" && (
                                        <p className="text-xs text-blue-600">ระบบจะค้นหาอาจารย์ที่ email ตรงกันโดยอัตโนมัติ ถ้าไม่พบจะสร้างข้อมูลอาจารย์ใหม่ให้</p>
                                    )}
                                    {linkMode === "manual" && (
                                        <div>
                                            <div className="relative">
                                                <select value={form.teacher_id || ""} onChange={handleSelectUnlinked}
                                                    className={selectCls("teacher_id")}>
                                                    <option value="">-- เลือกอาจารย์ --</option>
                                                    {unlinkedTeachers.map(t => (
                                                        <option key={t.teacher_id} value={t.teacher_id}>
                                                            {t.title_name}{t.first_name_th} {t.last_name_th}
                                                            {t.academic_position ? ` (${t.academic_position})` : ""}
                                                            {t.email ? ` — ${t.email}` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            {errors.teacher_id && <p className="mt-1 text-xs text-red-500">{errors.teacher_id}</p>}
                                            {form.teacher_id && (
                                                <p className="mt-1.5 text-xs text-blue-600">บัญชีนี้จะถูกเชื่อมกับอาจารย์ที่เลือก และอาจารย์จะสามารถ login ได้ทันที</p>
                                            )}
                                        </div>
                                    )}
                                    {linkMode === "new" && (
                                        <p className="text-xs text-blue-600">ระบบจะสร้างข้อมูลอาจารย์ใหม่จากข้อมูลที่กรอก</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">ข้อมูลส่วนตัว</p>
                    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-12">
                        <div className="sm:col-span-4">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">คำนำหน้า <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select name="prefix" value={form.prefix || ""} onChange={handlePrefixChange} className={selectCls("prefix")}>
                                    <option value="">— เลือก —</option>
                                    {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            {errors.prefix && <p className="mt-1 text-xs text-red-500">{errors.prefix}</p>}
                        </div>
                        {form.prefix === "อื่นๆ" && (
                            <div className="sm:col-span-8">
                                <label className="mb-1.5 block text-xs font-medium text-slate-600">ระบุคำนำหน้า <span className="text-red-400">*</span></label>
                                <input value={customPrefix} onChange={handleCustomPrefix} placeholder="เช่น ศ.พิเศษ" className={inputCls("prefix")} />
                            </div>
                        )}
                        <div className={form.prefix === "อื่นๆ" ? "sm:col-span-6" : "sm:col-span-4"}>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">ชื่อ <span className="text-red-400">*</span></label>
                            <input name="firstName" value={form.firstName || ""} onChange={handleChange} className={inputCls("firstName")} />
                            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        <div className={form.prefix === "อื่นๆ" ? "sm:col-span-6" : "sm:col-span-4"}>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">นามสกุล <span className="text-red-400">*</span></label>
                            <input name="lastName" value={form.lastName || ""} onChange={handleChange} className={inputCls("lastName")} />
                            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                        </div>
                        <div className="sm:col-span-8">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">อีเมล <span className="text-red-400">*</span></label>
                            <input name="email" value={form.email || ""} onChange={handleChange} placeholder="example@rmu.ac.th" className={inputCls("email")} />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div className="sm:col-span-4">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">เบอร์โทรศัพท์</label>
                            <input name="phone" value={formatPhoneDisplay(form.phone || "")} onChange={handlePhoneChange} placeholder="000-000-0000" className={inputCls("phone")} />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </div>
                    </div>

                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">ข้อมูลบัญชี</p>
                    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-12">
                        <div className={!isEdit ? "sm:col-span-6" : "sm:col-span-12"}>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Username {!isEdit && <span className="text-red-400">*</span>}
                                {isEdit && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-normal text-slate-400">ไม่สามารถแก้ไขได้</span>}
                            </label>
                            <input name="username" value={form.username || ""} autoComplete="off"
                                onChange={handleChange} readOnly={isEdit} disabled={isEdit}
                                className={isEdit ? "w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-400 outline-none" : inputCls("username")} />
                            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
                        </div>
                        {!isEdit && (
                            <div className="sm:col-span-6">
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <label className="block text-xs font-medium text-slate-600">Password <span className="text-red-400">*</span></label>
                                    <button type="button" onClick={generatePassword}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700">
                                        <Shuffle size={12} /> สุ่มรหัสผ่าน
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} name="password" value={form.password || ""}
                                        onChange={handleChange} autoComplete="new-password" className={`${inputCls("password")} pr-16`} />
                                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                                        {form.password && (
                                            <button type="button" onClick={handleCopyPassword}
                                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setShowPassword(s => !s)}
                                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-400">อย่างน้อย 8 ตัวอักษร และมีอักขระพิเศษอย่างน้อย 1 ตัว</p>
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </div>
                        )}
                        <div className="sm:col-span-6">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">บทบาท <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select name="role_id" value={form.role_id || ""} onChange={handleChange} className={selectCls("role_id")}>
                                    <option value="">— เลือกบทบาท —</option>
                                    {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            {errors.role_id && <p className="mt-1 text-xs text-red-500">{errors.role_id}</p>}
                        </div>
                        <div className="sm:col-span-6">
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">สถานะ</label>
                            <div className="relative">
                                <select name="status" value={form.status || "active"} onChange={handleChange} className={selectCls("status")}>
                                    <option value="active">ใช้งาน</option>
                                    <option value="inactive">ระงับ</option>
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* ── สังกัด (เฉพาะ teacher + mode new หรือไม่มี unlinked) ── */}
                    {isTeacher && (linkMode === "new" || !hasUnlinked) && (
                        <>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                สังกัด <span className="normal-case font-normal text-red-400">(จำเป็นสำหรับอาจารย์)</span>
                            </p>
                            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600">คณะ <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select name="faculty_id" value={form.faculty_id || ""} onChange={handleFacultyChange} className={selectCls("faculty_id")}>
                                            <option value="">-- เลือกคณะ --</option>
                                            {faculties.map(f => <option key={f.id} value={f.id}>{f.faculty_name_th}</option>)}
                                        </select>
                                        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600">สาขาวิชา <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select name="department_id" value={form.department_id || ""}
                                            onChange={handleChange} disabled={!form.faculty_id}
                                            className={`${selectCls("department_id")} ${!form.faculty_id ? "cursor-not-allowed opacity-50" : ""}`}>
                                            <option value="">{form.faculty_id ? "-- เลือกสาขา --" : "-- เลือกคณะก่อน --"}</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name_th}</option>)}
                                        </select>
                                        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    {errors.department_id && <p className="mt-1 text-xs text-red-500">{errors.department_id}</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button onClick={onClose}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                        ยกเลิก
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                        {loading ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                </div>
            </div>
        </div>
    );
};