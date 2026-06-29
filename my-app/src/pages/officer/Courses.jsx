import { useState, useEffect } from "react";
import { MainLayout } from "../../components/MainLayout";
import CourseModal, { parseEngDateToThaiDate } from "../../components/officer/CourseModal";
import CourseDetailModal from "../../components/officer/CourseDetailModal";
import Pagination from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Swal from "sweetalert2";
import api from "../../services/api";
import { usePagination } from "../../hooks/usePagination";
import {
    Plus, Eye, Pencil, Trash2, Search,
    ChevronDown, BookOpen, TrendingUp, CheckCircle, Clock,
} from "lucide-react";
// ── ตรงกับ EMPTY_FORM ใน CourseModal ──
const emptyForm = {
    faculty_id: "",
    department_id: "",
    curriculum_code: "",
    curriculum_name_th: "",
    curriculum_name_en: "",
    education_level: "bachelor",
    program_type: "new",
    degree_type_id: "",   // ← เพิ่มใหม่
    degree_name_th: "",
    degree_name_en: "",
    degree_abbr_th: "",
    degree_abbr_en: "",
    total_credits: "120",
    curriculum_year: "",
    revision_round: "1",
    effective_date: "",
    start_use_year: "",
    close_date: "",
};
// ── แปล enum เป็นภาษาไทย ──

const PROGRAM_TYPE_LABEL = {
    new: "หลักสูตรใหม่",
    revised: "หลักสูตรปรับปรุง",
};
const EDUCATION_LEVEL_LABEL = {
    bachelor: "ปริญญาตรี",
    master: "ปริญญาโท",
    doctoral: "ปริญญาเอก",
};

const EDUCATION_LEVEL_COLOR = {
    bachelor: "bg-blue-50 text-blue-700 border-blue-200",
    master: "bg-violet-50 text-violet-700 border-violet-200",
    doctoral: "bg-purple-50 text-purple-700 border-purple-200",
};

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await api.get("/courses");
            setCourses(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setIsEdit(false);
        setSelectedId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (course) => {
        console.log(course.curriculumApprovals);

        setIsEdit(true);
        setSelectedId(course.curriculum_id);

        setForm({
            faculty_id: String(course.departments?.faculty_id || ""),
            department_id: String(course.department_id || ""),
            curriculum_code: course.curriculum_code || "",
            curriculum_name_th: course.curriculum_name_th || "",
            curriculum_name_en: course.curriculum_name_en || "",

            education_level: course.education_level || "bachelor",

            degree_type_id: "0",
            degree_preset: "อื่นๆ (กรอกเอง)",

            degree_name_th: course.degree_name_th || "",
            degree_name_en: course.degree_name_en || "",
            degree_abbr_th: course.degree_abbr_th || "",
            degree_abbr_en: course.degree_abbr_en || "",

            total_credits: String(course.total_credits || "120"),

            curriculum_year: String(course.curriculum_year || ""),
            revision_round: String(course.revision_round || "1"),

            effective_date: parseEngDateToThaiDate(course.effective_date),
            close_date: course.close_date ? String(new Date(course.close_date).getFullYear() + 543) : "",

            curriculum_format: course.curriculum_format || "",
            curriculum_format_other: course.curriculum_format_other || "",

            curriculum_category: course.curriculum_category || "",
            curriculum_category_other: course.curriculum_category_other || "",

            teaching_language: course.teaching_language || "",
            teaching_language_other: course.teaching_language_other || "",

            admission_type: course.admission_type || "",

            cooperation_type: course.cooperation_type || "",
            cooperation_name: course.cooperation_name || "",

            degree_award_type: course.degree_award_type || "",
            degree_award_detail: course.degree_award_detail || "",

            curriculum_status: course.curriculum_status || "new",

            old_curriculum_name: course.old_curriculum_name || "",
            old_curriculum_year: course.old_curriculum_year || "",

            start_term: course.start_term || "",
            start_academic_year: course.start_academic_year || "",

            approvals: course.curriculumApprovals || [],
        });

        setShowModal(true);
    };

    const openDetailModal = async (id) => {
        try {
            const res = await api.get(`/courses/${id}`);
            if (!res.data.data) return;
            setSelectedCourse(res.data.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ",
            text: "คุณต้องการลบหลักสูตรนี้ใช่หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
        });
        if (!result.isConfirmed) return;
        try {
            await api.delete(`/courses/${id}`);
            await fetchCourses();
            Swal.fire("สำเร็จ", "ลบข้อมูลเรียบร้อย", "success");
        } catch (err) {
            console.error(err);
        }
    };

    const calculateProgress = (steps = []) => {
        if (!steps.length) return { percent: 0, completed: 0, total: 0 };
        const completed = steps.filter(s => s.status === "done").length;
        return { percent: Math.round((completed / steps.length) * 100), completed, total: steps.length };
    };

    const getCurrentStatus = (steps = []) => {
        if (!steps.length) return { text: "ยังไม่มีขั้นตอน", color: "bg-gray-100 text-gray-500 border-gray-200" };
        if (steps.find(s => s.status === "rejected"))
            return { text: "ปรับปรุงแก้ไข", color: "bg-red-50 text-red-600 border-red-200" };
        const current = steps.find(s => s.status === "current");
        if (current)
            return { text: current.step_name, color: "bg-blue-50 text-blue-600 border-blue-200" };
        return { text: "เผยแพร่แล้ว", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    };

    // filter
    const filteredCourses = courses.filter(course => {
        const keyword = search.toLowerCase();
        const matchSearch =
            course.curriculum_name_th?.toLowerCase().includes(keyword) ||
            course.curriculum_code?.toLowerCase().includes(keyword);
        const matchLevel = !levelFilter || course.education_level === levelFilter;

        const matchType = !typeFilter || course.curriculum_status === typeFilter;
        return matchSearch && matchLevel && matchType;
    });

    const { page, setPage, totalPages, paginated } = usePagination(filteredCourses, 10);

    // stats
    const totalCourses = courses.length;
    const doneCourses = courses.filter(c => c.curriculumProcesses?.length > 0 && c.curriculumProcesses.every(s => s.status === "done")).length;
    const inProgressCourses = courses.filter(c => c.curriculumProcesses?.some(s => s.status === "current")).length;
    const avgProgress = courses.length
        ? Math.round(courses.reduce((acc, c) => acc + calculateProgress(c.curriculumProcesses || []).percent, 0) / courses.length)
        : 0;

    return (
        <MainLayout role="officer">
            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">
                <div className="w-full">

                    {/* HEADER */}
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">จัดการข้อมูลหลักสูตร</h1>
                            <p className="mt-0.5 text-xs text-gray-400">จัดการข้อมูลหลักสูตรและติดตามความคืบหน้า</p>
                        </div>
                        <button onClick={openAddModal}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
                            <Plus size={15} />เพิ่มหลักสูตร
                        </button>
                    </div>

                    {/* STATS */}
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard icon={<BookOpen size={15} />} label="หลักสูตรทั้งหมด" value={totalCourses} color="blue" />
                        <StatCard icon={<TrendingUp size={15} />} label="ความคืบหน้าเฉลี่ย" value={`${avgProgress}%`} color="violet" />
                        <StatCard icon={<Clock size={15} />} label="กำลังดำเนินการ" value={inProgressCourses} color="amber" />
                        <StatCard icon={<CheckCircle size={15} />} label="เสร็จสมบูรณ์" value={doneCourses} color="emerald" />
                    </div>

                    {/* FILTER */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="relative flex-1" style={{ minWidth: "200px", maxWidth: "340px" }}>
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="ค้นหารหัสหรือชื่อหลักสูตร..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                        </div>

                        {/* filter ระดับ */}
                        <div className="relative">
                            <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
                                className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm text-gray-600 outline-none focus:border-blue-400">
                                <option value="">ระดับ — ทั้งหมด</option>
                                <option value="bachelor">ปริญญาตรี</option>
                                <option value="master">ปริญญาโท</option>
                                <option value="doctoral">ปริญญาเอก</option>
                            </select>
                            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* filter ประเภท */}
                        <div className="relative">
                            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                                className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm text-gray-600 outline-none focus:border-blue-400">
                                <option value="">ทั้งหมด</option>
                                <option value="new">หลักสูตรใหม่</option>
                                <option value="revised">หลักสูตรปรับปรุง</option>
                            </select>
                            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        <span className="ml-auto text-xs text-gray-400">{filteredCourses.length} รายการ</span>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <Th>รหัส</Th>
                                        <Th>ชื่อหลักสูตร</Th>
                                        <Th>คณะ / สาขา</Th>
                                        <Th>ระดับ / ประเภท</Th>
                                        <Th>ปี พ.ศ.</Th>
                                        <Th>ความคืบหน้า</Th>
                                        <Th>สถานะ</Th>
                                        <Th center>จัดการ</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan={8}><LoadingSpinner /></td></tr>
                                    ) : paginated.length === 0 ? (
                                        <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">ไม่พบข้อมูลหลักสูตร</td></tr>
                                    ) : (
                                        paginated.map(course => {
                                            const steps = course.curriculumProcesses || [];
                                            const progress = calculateProgress(steps);
                                            const status = getCurrentStatus(steps);
                                            return (
                                                <tr key={course.curriculum_id} className="transition hover:bg-blue-50/30">

                                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-600">
                                                        {course.curriculum_code || "—"}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div style={{ maxWidth: "260px" }}>
                                                            <p className="line-clamp-1 text-sm font-semibold text-gray-900">{course.curriculum_name_th}</p>
                                                            <p className="line-clamp-1 text-xs text-gray-400">{course.curriculum_name_en}</p>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <p className="text-xs font-medium text-gray-700">{course.departments?.faculties?.faculty_name_th || "—"}</p>
                                                        <p className="text-xs text-gray-400">{course.departments?.department_name_th || "—"}</p>
                                                    </td>

                                                    {/* ระดับ + ประเภท — แสดง enum เป็น label ไทย */}
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${EDUCATION_LEVEL_COLOR[course.education_level] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                                            {EDUCATION_LEVEL_LABEL[course.education_level] || course.education_level}
                                                        </span>
                                                        <p className="mt-0.5 text-xs text-gray-400">
                                                            {PROGRAM_TYPE_LABEL[course.program_type] || course.program_type}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-3 text-xs text-gray-600">
                                                        {course.curriculum_year}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                                                                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress.percent}%` }} />
                                                            </div>
                                                            <span className="w-8 text-right text-xs text-gray-400">{progress.percent}%</span>
                                                        </div>
                                                        <p className="mt-0.5 text-xs text-gray-400">{progress.completed}/{progress.total} ขั้นตอน</p>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                                                            {status.text}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <ActionBtn onClick={() => openDetailModal(course.curriculum_id)} hoverColor="hover:text-blue-600 hover:bg-blue-50" title="ดูรายละเอียด"><Eye size={15} /></ActionBtn>
                                                            <ActionBtn onClick={() => openEditModal(course)} hoverColor="hover:text-amber-600 hover:bg-amber-50" title="แก้ไข"><Pencil size={14} /></ActionBtn>
                                                            <ActionBtn onClick={() => handleDelete(course.curriculum_id)} hoverColor="hover:text-red-600 hover:bg-red-50" title="ลบ"><Trash2 size={14} /></ActionBtn>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
                    </div>
                </div>

                <CourseModal
                    open={showModal}
                    isEdit={isEdit}
                    form={form}
                    setForm={setForm}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchCourses}
                    selectedId={selectedId}
                />

                <CourseDetailModal
                    open={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    course={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                />
            </div>
        </MainLayout>
    );
};

// ── UI Components (เหมือนเดิม) ──
const StatCard = ({ icon, label, value, color }) => {
    const iconColors = {
        blue: "bg-blue-100 text-blue-600",
        violet: "bg-violet-100 text-violet-600",
        amber: "bg-amber-100 text-amber-600",
        emerald: "bg-emerald-100 text-emerald-600",
    };
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}>{icon}</div>
            <div className="min-w-0">
                <p className="truncate text-xs text-gray-400">{label}</p>
                <p className="text-base font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};

const Th = ({ children, center }) => (
    <th className={`px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 ${center ? "text-center" : "text-left"}`}>
        {children}
    </th>
);

const ActionBtn = ({ children, onClick, hoverColor, title }) => (
    <button onClick={onClick} title={title}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition ${hoverColor}`}>
        {children}
    </button>
);

export default Courses;