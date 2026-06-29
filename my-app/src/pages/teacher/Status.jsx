import { TeacherLayout } from "../../components/Teacher/TeacherLayout";
import { 
    Search, 
    ChevronDown, 
    X, 
    CheckCircle2, 
    Clock, 
    Circle, 
    Eye,
    Activity,
    FileText,
    AlertCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const steps = ["เสนอคณะ", "เสนอกรรมการวิชาการ", "เสนอสภาวิชาการ", "เสนอสภามหาวิทยาลัย", "เสนอ สป.อว.", "เผยแพร่หลักสูตร"];

const statusConfig = {
    green: { text: "text-green-600", bar: "bg-green-500" },
    blue: { text: "text-blue-600", bar: "bg-green-500" },
    red: { text: "text-red-600", bar: "bg-red-500" },
    gray: { text: "text-gray-400", bar: "bg-gray-200" },
};

const getStatusText = (status) => {
    switch (status) {
        case "done": return "ผ่านแล้ว";
        case "current": return "กำลังดำเนินการ";
        case "rejected": return "ส่งกลับแก้ไข";
        case "resubmitted": return "ส่งกลับเข้าพิจารณา";
        default: return "ยังไม่ดำเนินการ";
    }
};

const getStatusColor = (processes) => {
    if (!processes.length) return "gray";
    if (processes.some(p => p.status === "rejected")) return "red";
    if (processes.some(p => p.status === "current")) return "blue";
    if (processes.every(p => p.status === "done")) return "green";
    return "gray";
};

const getCurriculumTypeLabel = (type) => {
    if (!type) return null;
    if (type.includes("ปรับ")) return { label: "ปรับปรุง", cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return { label: "ใหม่", cls: "bg-gray-100 text-gray-600 border-gray-200" };
};

const StepIcon = ({ state }) => {
    if (state === "done") return <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-green-500 bg-white text-green-500"><CheckCircle2 size={15} /></div>;
    if (state === "rejected") return <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-500 ring-2 ring-red-100"><X size={13} /></div>;
    if (state === "active") return <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-blue-500 ring-2 ring-blue-100"><Clock size={13} /></div>;
    return <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-300"><Circle size={13} /></div>;
};

const Timeline = ({ processes }) => (
    <div className="flex items-start">
        {steps.map((step, idx) => {
            const proc = processes[idx];
            const procStatus = proc?.status || "pending";
            const state = procStatus === "done" ? "done" : procStatus === "rejected" ? "rejected" : procStatus === "current" ? "active" : "idle";
            const prevDone = idx > 0 && processes[idx - 1]?.status === "done";
            const selfDone = procStatus === "done";
            return (
                <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                        {idx > 0 && <div className={`h-0.5 flex-1 transition-colors ${prevDone ? "bg-green-400" : "bg-gray-200"}`} />}
                        <StepIcon state={state} />
                        {idx < steps.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${selfDone ? "bg-green-400" : "bg-gray-200"}`} />}
                    </div>
                    <span className="mt-1.5 text-center text-[10px] leading-tight text-gray-500 select-none">{step}</span>
                </div>
            );
        })}
    </div>
);

const TrackingDetail = ({ item, onClose }) => {
    const cfg = statusConfig[item.statusColor] || statusConfig.gray;
    const typeLabel = getCurriculumTypeLabel(item.curriculumType);
    const isRejected = item.statusColor === "red";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="px-6 pt-6 pb-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{item.courseName}</h2>
                            <p className="mt-0.5 text-sm text-gray-400">{item.faculty}</p>
                            {item.department && item.department !== "-" && (
                                <p className="text-xs text-gray-400">{item.department}</p>
                            )}
                        </div>
                        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
                    </div>
                    <div className="mt-3 flex gap-2">
                        {typeLabel && <span className={`rounded-lg border px-3 py-1 text-xs font-medium ${typeLabel.cls}`}>{typeLabel.label}</span>}
                        <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">พ.ศ. {item.patchYear}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">สถานะปัจจุบัน: <span className={`font-semibold ${cfg.text}`}>{item.status}</span></p>
                        <p className="text-sm font-bold text-gray-800">ความคืบหน้า: {item.progress}%</p>
                    </div>
                    <div className="mt-2 mb-5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full transition-all duration-700 ${isRejected ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${item.progress}%` }} />
                    </div>
                </div>
                <div className="border-t border-gray-100 px-6 py-5">
                    <p className="mb-4 text-sm font-semibold text-gray-800">ลำดับขั้นตอนการดำเนินการ</p>
                    <Timeline processes={item.rawProcesses} />
                </div>
                <div className="border-t border-gray-100 max-h-72 overflow-y-auto px-6 py-4">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {["ขั้นตอน", "สถานะ", "วันที่", "หมายเหตุ"].map(h => (
                                    <th key={h} className="pb-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {item.details.map((d, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 pr-4 text-sm text-gray-800">{d.label}</td>
                                    <td className="py-3 pr-4">
                                        {d.rawStatus === "done" ? <span className="flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle2 size={13} /> ผ่านแล้ว</span>
                                            : d.rawStatus === "current" ? <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600"><Clock size={13} /> กำลังดำเนินการ</span>
                                                : d.rawStatus === "rejected" ? <span className="flex items-center gap-1.5 text-sm font-medium text-red-500"><X size={13} /> ส่งกลับแก้ไข</span>
                                                    : <span className="flex items-center gap-1.5 text-sm text-gray-400"><Circle size={12} /> ยังไม่ดำเนินการ</span>}
                                    </td>
                                    <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">{d.date || "—"}</td>
                                    <td className="py-3 text-sm text-gray-400">{d.note === "-" ? "—" : d.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const CourseCard = ({ item, onSelect }) => {
    const cfg = statusConfig[item.statusColor] || statusConfig.gray;
    const typeLabel = getCurriculumTypeLabel(item.curriculumType);
    const isRejected = item.statusColor === "red";
    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{item.courseName}</h3>
                    <p className="mt-0.5 text-sm text-gray-400">{item.faculty}</p>
                    {item.department && item.department !== "-" && (
                        <p className="text-xs text-gray-400">{item.department}</p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {typeLabel && <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${typeLabel.cls}`}>{typeLabel.label}</span>}
                    <span className="text-sm text-gray-400">พ.ศ. {item.patchYear}</span>
                    {isRejected && <span className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white">ต้องปรับปรุง</span>}
                    <button onClick={() => onSelect(item)} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700">
                        <Eye size={15} className="text-blue-500" /> ดูรายละเอียด
                    </button>
                </div>
            </div>
            <div className="mt-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">สถานะ: <span className={`font-semibold ${cfg.text}`}>{item.status}</span></p>
                    <p className="text-sm text-gray-500">ความคืบหน้า: <span className="font-bold text-gray-800">{item.progress}%</span></p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full transition-all duration-700 ${isRejected ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${item.progress}%` }} />
                </div>
            </div>
            <div className="mt-5"><Timeline processes={item.rawProcesses} /></div>
        </div>
    );
};

// ════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════
export const Status = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [search, setSearch] = useState("");
    const [facultyFilter, setFacultyFilter] = useState("ทั้งหมด");
    const [departmentFilter, setDepartmentFilter] = useState("ทั้งหมด");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const itemsPerPage = 5;

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get("/courses");
            const mapped = res.data.data.map((course) => {
                const processes = course.curriculumProcesses || [];
                const doneCount = processes.filter(p => p.status === "done").length;
                const currentIdx = processes.findIndex(p => p.status === "current");
                return {
                    id: course.curriculum_id,
                    courseName: course.curriculum_name_th,
                    faculty: course.departments?.faculties?.faculty_name_th || "-",
                    department: course.departments?.department_name_th || "-",
                    patchYear: course.curriculum_year,
                    curriculumType: course.curriculum_type,
                    status:
                        processes.find(p => p.status === "current")?.step_name ||
                        processes.find(p => p.status === "rejected")?.step_name ||
                        (processes.length && doneCount === processes.length ? "เริ่มใช้หลักสูตร" : "ยังไม่ดำเนินการ"),
                    statusColor: getStatusColor(processes),
                    progress: processes.length > 0 ? Math.round((doneCount / processes.length) * 100) : 0,
                    currentStep: currentIdx >= 0 ? currentIdx : doneCount - 1,
                    rawProcesses: processes,
                    details: processes.map(p => ({
                        label: p.step_name,
                        status: getStatusText(p.status),
                        rawStatus: p.status,
                        date: p.process_date?.split("T")[0] || null,
                        note: p.note || "-",
                    })),
                };
            });
            setDocuments(mapped);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    // ── Faculties ──
    const faculties = useMemo(() => {
        const unique = [...new Set(documents.map(d => d.faculty).filter(f => f && f !== "-"))];
        return ["ทั้งหมด", ...unique.sort()];
    }, [documents]);

    // ── Departments cascade ──
    const departments = useMemo(() => {
        const src = facultyFilter === "ทั้งหมด" ? documents : documents.filter(d => d.faculty === facultyFilter);
        const unique = [...new Set(src.map(d => d.department).filter(f => f && f !== "-"))];
        return ["ทั้งหมด", ...unique.sort()];
    }, [documents, facultyFilter]);

    const handleFacultyChange = (e) => {
        setFacultyFilter(e.target.value);
        setDepartmentFilter("ทั้งหมด");
        setCurrentPage(1);
    };

    const handleClearAll = () => {
        setSearch(""); setFacultyFilter("ทั้งหมด"); setDepartmentFilter("ทั้งหมด"); setCurrentPage(1);
    };

    const hasFilter = search || facultyFilter !== "ทั้งหมด" || departmentFilter !== "ทั้งหมด";

    // ── Filter ──
    const filtered = useMemo(() => {
        return documents.filter(item => {
            const keyword = search.toLowerCase().trim();
            const matchSearch = !keyword || item.courseName?.toLowerCase().includes(keyword);
            const matchFaculty = facultyFilter === "ทั้งหมด" || item.faculty === facultyFilter;
            const matchDepartment = departmentFilter === "ทั้งหมด" || item.department === departmentFilter;
            return matchSearch && matchFaculty && matchDepartment;
        });
    }, [documents, search, facultyFilter, departmentFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ── Statistics for Dashboard feel ──
    const stats = useMemo(() => {
        const total = documents.length;
        const inProgress = documents.filter(d => d.statusColor === "blue" || d.statusColor === "red").length;
        const done = documents.filter(d => d.progress === 100).length;
        return { total, inProgress, done };
    }, [documents]);

    return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50/50 pb-10 space-y-6">

                    {/* 1. HERO BANNER */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-8 text-white shadow-md">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

                        <div className="relative z-10 space-y-2">
                            <span className="inline-block rounded-full bg-blue-500/30 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-100 uppercase">
                                ความคืบหน้า
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ติดตามสถานะหลักสูตร</h1>
                            <p className="text-sm text-blue-100/90 max-w-xl">
                                ติดตามความคืบหน้าการพัฒนาและปรับปรุงหลักสูตรในแต่ละขั้นตอน ตั้งแต่ยกร่างเสนอจนถึงเสร็จสมบูรณ์เปิดใช้งาน
                            </p>
                        </div>
                    </div>

                    {/* 2. STATS ROW (KPI cards to make it less empty) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <FileText size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400">หลักสูตรในระบบทั้งหมด</p>
                                <p className="text-xl font-bold text-gray-800">{stats.total} รายการ</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <Clock size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400">กำลังดำเนินการ / แก้ไข</p>
                                <p className="text-xl font-bold text-gray-800">{stats.inProgress} หลักสูตร</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <CheckCircle2 size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400">เสร็จสิ้นเริ่มใช้หลักสูตร</p>
                                <p className="text-xl font-bold text-gray-800">{stats.done} หลักสูตร</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. FILTER */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

                            {/* SEARCH */}
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={search}
                                    onChange={e => { setSearch(e.target.value.trimStart()); setCurrentPage(1); }}
                                    placeholder="ค้นหาชื่อหลักสูตร..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                            </div>

                            {/* FACULTY */}
                            <div className="relative lg:w-48">
                                <select value={facultyFilter} onChange={handleFacultyChange}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-3 pr-8 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
                                    {faculties.map(f => <option key={f} value={f}>{f === "ทั้งหมด" ? "— คณะทั้งหมด —" : f}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            {/* DEPARTMENT */}
                            <div className="relative lg:w-48">
                                <select value={departmentFilter}
                                    onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                                    disabled={departments.length <= 1}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-3 pr-8 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                                    {departments.map(d => <option key={d} value={d}>{d === "ทั้งหมด" ? "— สาขาทั้งหมด —" : d}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>

                            {/* ปุ่มล้างทั้งหมด */}
                            {hasFilter && (
                                <button onClick={handleClearAll}
                                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700">
                                    <X size={14} /> ล้างทั้งหมด
                                </button>
                            )}

                            <button onClick={() => { setCurrentPage(1); fetchCourses(); }}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95">
                                ค้นหา
                            </button>
                        </div>

                        {/* result count */}
                        {hasFilter && (
                            <p className="mt-2 text-xs text-gray-400">พบ {filtered.length} รายการ</p>
                        )}
                    </div>

                    {/* 4. LOADING */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-14">
                            <div className="relative h-10 w-10">
                                <div className="h-10 w-10 rounded-full border-4 border-blue-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                    )}

                    {/* 5. CARDS */}
                    {!loading && (
                        <div className="space-y-4">
                            {paginated.length === 0 && hasSearched && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-14">
                                    <p className="text-sm text-gray-400">ไม่พบข้อมูลหลักสูตร</p>
                                </div>
                            )}
                            {paginated.map(item => <CourseCard key={item.id} item={item} onSelect={setSelectedItem} />)}
                        </div>
                    )}

                    {/* PAGINATION */}
                    {totalPages > 1 && !loading && (
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-gray-500 font-medium">
                                แสดง {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} จาก {filtered.length} รายการ
                            </p>
                            <div className="flex gap-1.5">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition
                                            ${currentPage === page ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
            </div>

            {selectedItem && <TrackingDetail item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </TeacherLayout>
    );
};