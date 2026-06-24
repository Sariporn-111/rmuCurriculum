import { useEffect, useState } from "react";
import { MainLayout } from "../components/MainLayout";
import {
    Mail, Phone, User, Shield, Pencil, Lock, X, Check,
    Building2, Save, KeyRound, BadgeCheck, Clock, Camera,
    ChevronRight
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Swal from "sweetalert2";

const ROLE_LABELS = {
    admin: "ผู้ดูแลระบบ",
    teacher: "อาจารย์",
    officer: "เจ้าหน้าที่",
};

const ROLE_STYLES = {
    admin: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
    teacher: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
    officer: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
};

export const Profile = () => {
    const { user: authUser, setUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});

    const [pwMode, setPwMode] = useState(false);
    const [pwForm, setPwForm] = useState({
        current_password: "", new_password: "", confirm_password: ""
    });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setProfile(res.data);
            setEditForm({
                title: res.data.title || "",
                first_name: res.data.first_name || "",
                last_name: res.data.last_name || "",
                email: res.data.email || "",
                phone: res.data.phone || "",
            });
        } catch {
            Swal.fire("ผิดพลาด", "ไม่สามารถดึงข้อมูลได้", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const res = await api.put('/profile', editForm);
            setProfile(prev => ({ ...prev, ...res.data }));
            setUser(prev => ({ ...prev, first_name: res.data.first_name, last_name: res.data.last_name }));
            setEditMode(false);
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกสำเร็จ", showConfirmButton: false, timer: 2000 });
        } catch {
            Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกได้", "error");
        }
    };

    const handleChangePassword = async () => {
        if (pwForm.new_password !== pwForm.confirm_password)
            return Swal.fire("ผิดพลาด", "รหัสผ่านใหม่ไม่ตรงกัน", "error");
        if (pwForm.new_password.length < 6)
            return Swal.fire("ผิดพลาด", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร", "error");
        try {
            await api.put('/profile/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
            setPwMode(false);
            setPwForm({ current_password: "", new_password: "", confirm_password: "" });
            Swal.fire({ toast: true, position: "top-end", icon: "success", title: "เปลี่ยนรหัสผ่านสำเร็จ", showConfirmButton: false, timer: 2000 });
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error");
        }
    };

    const displayName = profile
        ? `${profile.title ?? ""} ${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
        : "";
    const rs = ROLE_STYLES[profile?.role_name] || ROLE_STYLES.officer;

    if (loading) return (
        <MainLayout role={authUser?.role || "admin"}>
            <div className="flex items-center justify-center min-h-screen text-slate-400">กำลังโหลด...</div>
        </MainLayout>
    );

    return (
        <MainLayout role={authUser?.role || "admin"}>
            <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
                <div className="space-y-6">

                    {/* ── HERO CARD ── */}
                    <div className="relative rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200/80 bg-white">
                        {/* Gradient Banner — matching sidebar from-blue-900 to-blue-950 */}
                        <div className="h-36 relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950">
                            <div className="absolute inset-0 opacity-[0.07]"
                                style={{ backgroundImage: "radial-gradient(circle at 15% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 30%, white 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
                        </div>

                        <div className="px-6 md:px-8 pb-6">
                            {/* Avatar row — overlapping the banner */}
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-16">
                                {/* Avatar */}
                                <div className="flex items-end gap-5">
                                    <div className="relative shrink-0">
                                        <div className="h-32 w-32 rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-xl ring-4 ring-white bg-gradient-to-b from-blue-900 to-blue-950">
                                            {profile?.first_name?.charAt(0) ?? "?"}
                                        </div>
                                        <button className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white shadow-md ring-1 ring-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-900 transition">
                                            <Camera size={14} />
                                        </button>
                                    </div>
                                    <div className="pb-1">
                                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{displayName}</h1>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rs.bg} ${rs.text} ${rs.border}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${rs.dot}`} />
                                                {ROLE_LABELS[profile?.role_name] ?? profile?.role_name}
                                            </span>
                                            {/* <span className="text-sm text-slate-400 flex items-center gap-1">
                                                <Building2 size={12} /> {profile?.department || "สาขาวิชาเทคโนโลยีสารสนเทศ"}
                                            </span> */}
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {!editMode && !pwMode && (
                                    <div className="flex items-center gap-2 sm:pb-1">
                                        <button
                                            onClick={() => { setEditMode(true); setPwMode(false); }}
                                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition"
                                        >
                                            <Pencil size={14} /> แก้ไขข้อมูล
                                        </button>
                                        <button
                                            onClick={() => { setPwMode(true); setEditMode(false); }}
                                            className="flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 active:scale-[0.98] transition"
                                        >
                                            <KeyRound size={14} /> เปลี่ยนรหัสผ่าน
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── 2-COLUMN GRID ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        {/* ── LEFT (3/5): Info / Edit / Password ── */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Personal Info — view mode */}
                            {!editMode && !pwMode && (
                                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                                    <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-900">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <User size={16} />
                                        </div>
                                        ข้อมูลส่วนตัว
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { icon: BadgeCheck, label: "คำนำหน้า", value: profile?.title || "-", color: "text-indigo-500" },
                                            { icon: User, label: "ชื่อจริง", value: profile?.first_name || "-", color: "text-indigo-500" },
                                            { icon: User, label: "นามสกุล", value: profile?.last_name || "-", color: "text-indigo-500" },
                                            { icon: Shield, label: "บทบาท", value: ROLE_LABELS[profile?.role_name] ?? profile?.role_name, color: "text-rose-500" },
                                            { icon: Mail, label: "อีเมล", value: profile?.email || "-", color: "text-blue-500" },
                                            { icon: Phone, label: "เบอร์โทรศัพท์", value: profile?.phone || "-", color: "text-emerald-500" },
                                            // { icon: Building2, label: "สังกัด/ภาควิชา", value: profile?.department || "-", color: "text-slate-400", colSpan: "sm:col-span-2" },
                                        ].map(({ icon: Icon, label, value, color, colSpan }) => (
                                            <div key={label} className={`group flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200/60 hover:ring-indigo-200 hover:bg-indigo-50/30 transition ${colSpan ?? ""}`}>
                                                <div className={`shrink-0 ${color}`}>
                                                    <Icon size={17} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Edit Info Form */}
                            {editMode && (
                                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-indigo-300/40">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                <Pencil size={16} />
                                            </div>
                                            แก้ไขข้อมูลส่วนตัว
                                        </h3>
                                        <button onClick={() => setEditMode(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "คำนำหน้า", field: "title", type: "select", options: ["นาย", "นาง", "นางสาว"] },
                                            { label: "เบอร์โทรศัพท์", field: "phone", type: "text" },
                                            { label: "ชื่อจริง", field: "first_name", type: "text" },
                                            { label: "อีเมล", field: "email", type: "email" },
                                            { label: "นามสกุล", field: "last_name", type: "text" },
                                        ].map(({ label, field, type, options }) => (
                                            <div key={field}>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
                                                {type === "select" ? (
                                                    <select value={editForm[field]} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition">
                                                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input type={type} value={editForm[field] || ""} onChange={e => setEditForm(p => ({ ...p, [field]: e.target.value }))}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 focus:outline-none transition" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                                        <button onClick={() => setEditMode(false)}
                                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition">
                                            ยกเลิก
                                        </button>
                                        <button onClick={handleSaveProfile}
                                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition">
                                            <Save size={15} /> บันทึกข้อมูล
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Change Password Form */}
                            {pwMode && (
                                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-amber-300/40">
                                    <div className="mb-6 flex items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                <KeyRound size={16} />
                                            </div>
                                            เปลี่ยนรหัสผ่าน
                                        </h3>
                                        <button onClick={() => setPwMode(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-4 max-w-md">
                                        {[
                                            { label: "รหัสผ่านปัจจุบัน", key: "current_password" },
                                            { label: "รหัสผ่านใหม่", key: "new_password" },
                                            { label: "ยืนยันรหัสผ่านใหม่อีกครั้ง", key: "confirm_password" },
                                        ].map(({ label, key }) => (
                                            <div key={key}>
                                                <label className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</label>
                                                <input type="password" value={pwForm[key]}
                                                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-50 focus:outline-none transition" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                                        <button onClick={() => setPwMode(false)}
                                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition">
                                            ยกเลิก
                                        </button>
                                        <button onClick={handleChangePassword}
                                            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-[0.98] transition">
                                            <Save size={15} /> อัปเดตรหัสผ่าน
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── RIGHT (2/5): Security + Activity ── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Security Card */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                        <Lock size={16} />
                                    </div>
                                    ความปลอดภัย
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60 hover:ring-slate-300 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                <Shield size={15} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">รหัสผ่าน</p>
                                                <p className="text-xs text-slate-400 mt-0.5">เปลี่ยนล่าสุดเมื่อไม่นานมานี้</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setPwMode(true); setEditMode(false); }}
                                            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                        >
                                            เปลี่ยน <ChevronRight size={13} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <Mail size={15} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">อีเมลยืนยันตัวตน</p>
                                                <p className="text-xs text-slate-400 mt-0.5">เปิดใช้งานแล้ว</p>
                                            </div>
                                        </div>
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                                            <Check size={13} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info Card */}
                            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                        <User size={16} />
                                    </div>
                                    ข้อมูลบัญชี
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "ชื่อผู้ใช้", value: profile?.username || "-", icon: BadgeCheck, iconColor: "text-slate-500" },
                                        { label: "บทบาทในระบบ", value: ROLE_LABELS[profile?.role_name] ?? profile?.role_name ?? "-", icon: Shield, iconColor: "text-slate-500" },
                                        { label: "วันที่สมัครสมาชิก", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-", icon: Clock, iconColor: "text-slate-500" },
                                        { label: "อัปเดตล่าสุด", value: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-", icon: Clock, iconColor: "text-slate-500" },
                                        { label: "สถานะบัญชี", value: "ใช้งานอยู่", icon: Check, iconColor: "text-emerald-500", badge: true },
                                    ].map(({ label, value, icon: Icon, iconColor, badge }) => (
                                        <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/60">
                                            <div className="flex items-center gap-2.5">
                                                <Icon size={15} className={`shrink-0 ${iconColor}`} />
                                                <p className="text-xs text-slate-400">{label}</p>
                                            </div>
                                            {badge ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{value}
                                                </span>
                                            ) : (
                                                <p className="text-xs font-semibold text-slate-700">{value}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};