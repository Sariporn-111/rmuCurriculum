import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Mail, ChevronDown } from "lucide-react";
import logo from "../assets/logo_rmu.png";
import api from "../services/api";
import Swal from "sweetalert2";

const TITLES = ["นาย", "นาง", "นางสาว", "ผศ.", "ผศ.ดร.", "รศ.", "รศ.ดร.", "อ.", "ดร."];

export const Register = () => {
    const navigate = useNavigate();
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);


    const [form, setForm] = useState({
        title: "",
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        password: "",
        confirm_password: "",
        faculty_id: "",
        department_id: "",
    });
    useEffect(() => {
        api.get("/faculties").then(res => setFaculties(res.data.data || []));
    }, []);

    useEffect(() => {
        if (form.faculty_id) {
            api.get(`/faculties/${form.faculty_id}/departments`)
                .then(res => setDepartments(res.data.data || []));
        } else {
            setDepartments([]);
        }
    }, [form.faculty_id]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate
        if (!form.title) return setError("กรุณาเลือกคำนำหน้าชื่อ");
        if (!form.first_name.trim()) return setError("กรุณากรอกชื่อ");
        if (!form.last_name.trim()) return setError("กรุณากรอกนามสกุล");
        if (!form.email.trim()) return setError("กรุณากรอกอีเมล");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("รูปแบบอีเมลไม่ถูกต้อง");
        if (!form.username.trim()) return setError("กรุณากรอกชื่อผู้ใช้");
        if (form.username.length < 4) return setError("ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร");
        if (form.password.length < 6) return setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        if (form.password !== form.confirm_password) return setError("รหัสผ่านไม่ตรงกัน");

        try {
            setLoading(true);
            await api.post("/register", {
                username: form.username.trim().toLowerCase(),
                password: form.password,
                title: form.title,
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim().toLowerCase(),
                department_id: form.department_id ? Number(form.department_id) : null,
            });

            await Swal.fire({
                icon: "success",
                title: "ลงทะเบียนสำเร็จ",
                text: "คุณสามารถเข้าสู่ระบบได้เลยค่ะ",
                confirmButtonText: "เข้าสู่ระบบ",
                confirmButtonColor: "#1e3a8a",
            });

            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-full pl-10 pr-4 py-2 border border-gray-300 bg-white outline-none focus:border-blue-500 text-sm";

    return (
        <div className="min-h-screen flex">
            {/* LEFT */}
            <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 text-white">
                <img src={logo} alt="logo" className="w-40 mb-6" />
                <h1 className="text-xl font-semibold text-center leading-relaxed">
                    ระบบฐานข้อมูลหลักสูตร
                    <br />
                    สภาวิชาการ
                </h1>
                <p className="text-sm text-gray-200 mt-3 text-center">
                    มหาวิทยาลัยราชภัฏมหาสารคาม
                </p>
            </div>

            {/* RIGHT */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 px-4 py-8">
                <div className="w-full max-w-md bg-gray-200 rounded-2xl shadow-md p-8">
                    <h2 className="text-3xl font-semibold mb-1">ลงทะเบียน</h2>
                    <p className="text-sm text-gray-500 mb-6">สำหรับอาจารย์เท่านั้น</p>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* คำนำหน้า */}
                        <div>
                            <label className="text-sm block mb-1">คำนำหน้าชื่อ</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className={`${inputClass} appearance-none`}
                                >
                                    <option value="">-- เลือกคำนำหน้า --</option>
                                    {TITLES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* ชื่อ - นามสกุล */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm block mb-1">ชื่อ</label>
                                <input
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    placeholder="ชื่อ"
                                    className="w-full rounded-full px-4 py-2 border border-gray-300 bg-white outline-none focus:border-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-sm block mb-1">นามสกุล</label>
                                <input
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    placeholder="นามสกุล"
                                    className="w-full rounded-full px-4 py-2 border border-gray-300 bg-white outline-none focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-sm block mb-1">อีเมล</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="email@rmu.ac.th"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        {/* คณะ */}
                        <div>
                            <label className="text-sm block mb-1">คณะ</label>
                            <div className="relative">
                                <select
                                    name="faculty_id"
                                    value={form.faculty_id}
                                    onChange={handleChange}
                                    className={`${inputClass} appearance-none`}
                                >
                                    <option value="">-- เลือกคณะ --</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.faculty_name_th}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* สาขา */}
                        <div>
                            <label className="text-sm block mb-1">สาขาวิชา</label>
                            <div className="relative">
                                <select
                                    name="department_id"
                                    value={form.department_id}
                                    onChange={handleChange}
                                    disabled={!form.faculty_id}
                                    className={`${inputClass} appearance-none ${!form.faculty_id ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <option value="">{form.faculty_id ? "-- เลือกสาขา --" : "-- เลือกคณะก่อน --"}</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.department_name_th}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        {/* Username */}
                        <div>
                            <label className="text-sm block mb-1">ชื่อผู้ใช้</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    name="username"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษ)"
                                    autoComplete="username"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm block mb-1">รหัสผ่าน</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    name="password"
                                    type={showPw ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="อย่างน้อย 6 ตัวอักษร"
                                    autoComplete="new-password"
                                    className={`${inputClass} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="text-sm block mb-1">ยืนยันรหัสผ่าน</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    name="confirm_password"
                                    type={showConfirmPw ? "text" : "password"}
                                    value={form.confirm_password}
                                    onChange={handleChange}
                                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                                    autoComplete="new-password"
                                    className={`${inputClass} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPw((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-600 text-sm">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 rounded-full text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-60 transition"
                        >
                            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
                        </button>

                        {/* Link กลับ login */}
                        <p className="text-center text-sm text-gray-500">
                            มีบัญชีอยู่แล้ว?{" "}
                            <Link to="/" className="text-blue-700 hover:underline font-medium">
                                เข้าสู่ระบบ
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;