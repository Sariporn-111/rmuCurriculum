import { TeacherLayout } from "../../components/Teacher/TeacherLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Search, 
    Download, 
    User, 
    BookOpen, 
    GraduationCap, 
    Award, 
    Calendar, 
    Layers, 
    ArrowRight,
    Mail, 
    Phone,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText
} from "lucide-react";
import api from "../../services/api";

const formatMap = {
    bachelor_4_year: "ปริญญาตรี 4 ปี",
    bachelor_5_year: "ปริญญาตรี 5 ปี",
    bachelor_continuing: "ปริญญาตรี (ต่อเนื่อง)",
    master: "ปริญญาโท",
    doctoral: "ปริญญาเอก",
    other: "อื่นๆ",
};

const languageMap = {
    thai: "ภาษาไทย",
    english: "ภาษาอังกฤษ",
    thai_english: "ภาษาไทยและภาษาอังกฤษ",
    other: "อื่นๆ",
};

const admissionMap = {
    thai_only: "นักศึกษาไทยเท่านั้น",
    foreign_only: "นักศึกษาต่างชาติเท่านั้น",
    thai_and_foreign_thai_language: "นักศึกษาไทยและต่างชาติ (ใช้ภาษาไทย)",
    thai_and_foreign: "นักศึกษาไทยและต่างชาติ",
};

const levelMap = {
    bachelor: "ปริญญาตรี",
    master: "ปริญญาโท",
    doctoral: "ปริญญาเอก",
};

export const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                // 1. ดึงโปรไฟล์อาจารย์
                const profileRes = await api.get("/teachers/me");
                setProfile(profileRes.data.data);

                // 2. ดึงหลักสูตรในสาขาวิชา (API กรองให้อัตโนมัติในฝั่ง Backend สำหรับบทบาท teacher)
                const coursesRes = await api.get("/courses");
                setCourses(coursesRes.data.data || []);
            } catch (err) {
                console.error("Error loading dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // จัดรูปแบบชื่อสำหรับแสดงผล
    const getTeacherDisplayName = () => {
        if (!profile) return "อาจารย์";
        const parts = [
            profile.academic_position,
            profile.title_name,
            profile.first_name_th,
            profile.last_name_th
        ].filter(p => p && p !== "-");
        
        return parts.length > 0 ? parts.join(" ") : "อาจารย์ประจำสาขาวิชา";
    };

    const quickLinks = [
        {
            icon: <Search size={24} />,
            label: "ค้นหาเอกสาร สมอ.08",
            desc: "เข้าถึงและดาวน์โหลดเอกสาร สมอ.08 ของหลักสูตรทั้งหมด",
            path: "/teacher/smo08",
            color: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
        },
        {
            icon: <Download size={24} />,
            label: "เอกสารรับรองคุณวุฒิ",
            desc: "ตรวจสอบและดาวน์โหลดเอกสารรับรองคุณวุฒิหลักสูตร (กพ. / กพศ.)",
            path: "/teacher/teachercertification",
            color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300",
        },
        {
            icon: <Layers size={24} />,
            label: "ติดตามสถานะหลักสูตร",
            desc: "ดูรายละเอียดขั้นตอนการดำเนินงานพัฒนาหลักสูตรอย่างละเอียด",
            path: "/teacher/status",
            color: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300",
        },
    ];

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="relative h-12 w-12">
                        <div className="h-12 w-12 rounded-full border-4 border-blue-100" />
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-gray-500">กำลังโหลดข้อมูลหลักสูตรและแดชบอร์ด...</p>
                </div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="space-y-6 pb-10">
                {/* 1. HERO PROFILE CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 md:p-8 text-white shadow-lg">
                    {/* Background decoration elements */}
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                        {/* Profile Image / Avatar */}
                        <div className="relative flex-shrink-0">
                            {profile?.profile_image ? (
                                <img
                                    src={`http://localhost:3000${profile.profile_image}`}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-md"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className="h-24 w-24 rounded-2xl border-4 border-white/20 bg-white/10 flex items-center justify-center shadow-md"
                                 style={{ display: profile?.profile_image ? 'none' : 'flex' }}>
                                <User size={40} className="text-white/80" />
                            </div>
                        </div>

                        {/* Profile Information */}
                        <div className="text-center md:text-left flex-1 space-y-2">
                            <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-200 uppercase">
                                บทบาท: อาจารย์ประจำหลักสูตร
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                {getTeacherDisplayName()}
                            </h1>
                            
                            {/* Department / Faculty info */}
                            {profile?.department ? (
                                <p className="text-base text-blue-100 font-medium flex flex-wrap items-center justify-center md:justify-start gap-2">
                                    <GraduationCap size={18} />
                                    <span>สาขาวิชา{profile.department.department_name_th}</span>
                                    <span className="text-white/40">|</span>
                                    <span>คณะ{profile.department.faculties?.faculty_name_th}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-blue-200">ไม่พบข้อมูลสังกัดสาขาวิชา</p>
                            )}

                            {/* Contact info grid */}
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-blue-100">
                                {profile?.employee_code && (
                                    <span className="font-mono">รหัสประจำตัว: {profile.employee_code}</span>
                                )}
                                {profile?.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail size={12} /> {profile.email}
                                    </span>
                                )}
                                {profile?.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone size={12} /> {profile.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. STATS OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400">หลักสูตรในสาขาวิชาของคุณ</p>
                            <p className="text-xl font-bold text-gray-800">{courses.length} หลักสูตร</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400">เอกสาร สมอ.08 ในระบบ</p>
                            <p className="text-xl font-bold text-gray-800">
                                {courses.filter(c => c.smo08 && c.smo08.length > 0).length} รายการ
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-400">หลักสูตรที่ได้รับการรับรอง</p>
                            <p className="text-xl font-bold text-gray-800">
                                {courses.filter(c => c.curriculumCertifications && c.curriculumCertifications.length > 0).length} หลักสูตร
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. DETAILED CURRICULUMS SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">รายละเอียดหลักสูตรของฉัน</h2>
                            <p className="text-xs text-gray-500">ข้อมูลรายละเอียดหลักสูตรและการดำเนินการพัฒนาหลักสูตร</p>
                        </div>
                    </div>

                    {courses.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-14 px-4 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="mt-3 text-sm font-semibold text-gray-800">ไม่พบหลักสูตรในสาขาวิชาของคุณ</h3>
                            <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
                                หากพิจารณาแล้วว่ามีข้อผิดพลาดของข้อมูล กรุณาติดต่อผู้ดูแลระบบ (Officer) เพื่อตรวจสอบข้อมูลสาขาวิชาและหลักสูตรที่ผูกกับบัญชีของคุณ
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {courses.map((course) => {
                                // คำนวณความคืบหน้าของกระบวนการ
                                const processes = course.curriculumProcesses || [];
                                const doneCount = processes.filter(p => p.status === "done").length;
                                const currentStep = processes.find(p => p.status === "current") || 
                                                    processes.find(p => p.status === "rejected") ||
                                                    (processes.length && doneCount === processes.length ? { step_name: "เริ่มใช้หลักสูตร", status: "done" } : null);
                                const progress = processes.length > 0 ? Math.round((doneCount / processes.length) * 100) : 0;
                                const isRejected = currentStep?.status === "rejected";

                                return (
                                    <div key={course.curriculum_id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-200">
                                        
                                        {/* Curriculum Header */}
                                        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                        รหัส {course.curriculum_code || "-"}
                                                    </span>
                                                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                                        {levelMap[course.education_level] || "ปริญญาตรี"}
                                                    </span>
                                                    <span className="rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                                        {course.curriculum_status === "revised" ? "ปรับปรุง" : "หลักสูตรใหม่"}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900">
                                                    {course.curriculum_name_th}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium italic">
                                                    {course.curriculum_name_en || "-"}
                                                </p>
                                            </div>
                                            <div className="text-left md:text-right shrink-0">
                                                <p className="text-xs text-gray-400 font-medium">วันที่มีผลบังคับใช้</p>
                                                <p className="text-sm font-bold text-gray-700">
                                                    {course.effective_date ? course.effective_date.split("T")[0] : "-"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Curriculum Details Content */}
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                
                                                {/* Column 1: Core Info */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">ปริญญาบัตร (ภาษาไทย)</span>
                                                        <span className="text-sm font-semibold text-gray-800">{course.degree_name_th || "-"}</span>
                                                        <span className="text-xs text-gray-500 ml-1">({course.degree_abbr_th || "-"})</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">ปริญญาบัตร (ภาษาอังกฤษ)</span>
                                                        <span className="text-sm font-semibold text-gray-800">{course.degree_name_en || "-"}</span>
                                                        <span className="text-xs text-gray-500 ml-1">({course.degree_abbr_en || "-"})</span>
                                                    </div>
                                                </div>

                                                {/* Column 2: Credits & Years */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">หน่วยกิตทั้งหมด</span>
                                                        <span className="text-sm font-bold text-blue-600">{course.total_credits} หน่วยกิต</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">ปีเปิดรับ / ปีหลักสูตร พ.ศ.</span>
                                                        <span className="text-sm font-semibold text-gray-800">พ.ศ. {course.curriculum_year}</span>
                                                    </div>
                                                </div>

                                                {/* Column 3: Format & Language */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">รูปแบบการศึกษา</span>
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {formatMap[course.curriculum_format] || course.curriculum_format_other || "-"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">ภาษาที่ใช้จัดการสอน</span>
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {languageMap[course.teaching_language] || course.teaching_language_other || "-"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Column 4: Category & Admissions */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">การรับเข้าศึกษา</span>
                                                        <span className="text-sm font-semibold text-gray-800 leading-snug">
                                                            {admissionMap[course.admission_type] || "-"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-medium text-gray-400">ความร่วมมือสถาบัน</span>
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {course.cooperation_type === "collaborative" ? `ร่วมมือกับ: ${course.cooperation_name}` : "หลักสูตรเฉพาะของสถาบัน"}
                                                        </span>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* Progress bar tracking of curriculum process */}
                                            {processes.length > 0 && (
                                                <div className="mt-8 border-t border-gray-100 pt-6">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                                สถานะการดำเนินงานปัจจุบัน:
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-sm font-bold ${
                                                                isRejected ? "text-red-600" : progress === 100 ? "text-green-600" : "text-blue-600"
                                                            }`}>
                                                                {isRejected ? <AlertCircle size={15} /> : progress === 100 ? <CheckCircle size={15} /> : <Clock size={15} />}
                                                                {currentStep?.step_name || "ยังไม่มีข้อมูล"}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                                                            คืบหน้า {progress}%
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Progress bar line */}
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${
                                                            isRejected ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                                                        }`} style={{ width: `${progress}%` }} />
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <button 
                                                            onClick={() => navigate("/teacher/status")}
                                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                                                        >
                                                            ดูไทม์ไลน์และประวัติอย่างละเอียด <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. QUICK LINKS CARD */}
                <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">เข้าถึงข้อมูลด่วน (Quick Links)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickLinks.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-start gap-3 border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition duration-200 text-left group ${item.color}`}
                            >
                                <div className="rounded-xl bg-white p-2.5 shadow-sm group-hover:scale-105 transition duration-200">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-gray-800 text-sm">{item.label}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed font-normal">{item.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </TeacherLayout>
    );
};