import { TeacherLayout } from "../../components/Teacher/TeacherLayout";

import {
    Search,
    ChevronDown,
    X,
    CheckCircle2,
    Clock,
    Circle,
    Eye,
    Info,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

// =========================
// STEP LABELS
// =========================

const steps = [
    "เริ่มต้น",
    "วิเคราะห์",
    "จัดทำร่าง",
    "กก.คณะ",
    "สภาวิชาการ",
    "สภา มรม.",
    "อว./วิชาชีพ",
    "เปิดใช้",
];

// =========================
// STATUS CONFIG
// =========================

const statusConfig = {
    green: { text: "text-green-600", bar: "bg-green-500", dot: "bg-green-500" },
    blue: { text: "text-blue-600", bar: "bg-green-500", dot: "bg-blue-500" },
    red: { text: "text-red-600", bar: "bg-red-500", dot: "bg-red-500" },
    gray: { text: "text-gray-400", bar: "bg-gray-200", dot: "bg-gray-400" },
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
    if (processes.some((p) => p.status === "rejected")) return "red";
    if (processes.some((p) => p.status === "current")) return "blue";
    if (processes.every((p) => p.status === "done")) return "green";
    return "gray";
};

const getCurriculumTypeLabel = (type) => {
    if (!type) return null;
    if (type.includes("ปรับ")) return { label: "ปรับปรุง", cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return { label: "ใหม่", cls: "bg-gray-100 text-gray-600 border-gray-200" };
};

// =========================
// STEP ICON
// =========================

const StepIcon = ({ state }) => {
    if (state === "done") return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-green-500 bg-white text-green-500">
            <CheckCircle2 size={15} />
        </div>
    );
    if (state === "rejected") return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-500 ring-2 ring-red-100">
            <X size={13} />
        </div>
    );
    if (state === "active") return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-blue-500 ring-2 ring-blue-100">
            <Clock size={13} />
        </div>
    );
    return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-300">
            <Circle size={13} />
        </div>
    );
};

// =========================
// TIMELINE ROW
// =========================

const Timeline = ({ processes }) => (
    <div className="flex items-start">
        {steps.map((step, idx) => {
            const proc = processes[idx];
            const procStatus = proc?.status || "pending";
            const state = procStatus === "done" ? "done"
                : procStatus === "rejected" ? "rejected"
                    : procStatus === "current" ? "active"
                        : "idle";

            const prevDone = idx > 0 && (processes[idx - 1]?.status === "done");
            const selfDone = procStatus === "done";

            return (
                <div key={step} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                        {idx > 0 && (
                            <div className={`h-0.5 flex-1 transition-colors ${prevDone ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                        <StepIcon state={state} />
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 transition-colors ${selfDone ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                    </div>
                    <span className="mt-1.5 text-center text-[10px] leading-tight text-gray-500 select-none">
                        {step}
                    </span>
                </div>
            );
        })}
    </div>
);

// =========================
// DETAIL MODAL  (รูปที่ 3)
// =========================

const TrackingDetail = ({ item, onClose }) => {
    const cfg = statusConfig[item.statusColor] || statusConfig.gray;
    const typeLabel = getCurriculumTypeLabel(item.curriculumType);
    const isRejected = item.statusColor === "red";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* HEAD */}
                <div className="px-6 pt-6 pb-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{item.courseName}</h2>
                            <p className="mt-0.5 text-sm text-gray-400">{item.faculty}</p>
                        </div>
                        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                            <X size={15} />
                        </button>
                    </div>

                    {/* badges */}
                    <div className="mt-3 flex gap-2">
                        {typeLabel && (
                            <span className={`rounded-lg border px-3 py-1 text-xs font-medium ${typeLabel.cls}`}>
                                {typeLabel.label}
                            </span>
                        )}
                        <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            พ.ศ. {item.patchYear}
                        </span>
                    </div>

                    {/* status + % */}
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            สถานะปัจจุบัน:{" "}
                            <span className={`font-semibold ${cfg.text}`}>{item.status}</span>
                        </p>
                        <p className="text-sm font-bold text-gray-800">ความคืบหน้า: {item.progress}%</p>
                    </div>
                    <div className="mt-2 mb-5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isRejected ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                </div>

                {/* TIMELINE */}
                <div className="border-t border-gray-100 px-6 py-5">
                    <p className="mb-4 text-sm font-semibold text-gray-800">ลำดับขั้นตอนการดำเนินการ</p>
                    <Timeline processes={item.rawProcesses} />
                </div>

                {/* TABLE */}
                <div className="border-t border-gray-100 max-h-72 overflow-y-auto px-6 py-4">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {["ขั้นตอน", "สถานะ", "วันที่", "หมายเหตุ"].map((h) => (
                                    <th key={h} className="pb-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {item.details.map((d, idx) => {
                                const isDone = d.rawStatus === "done";
                                const isActive = d.rawStatus === "current";
                                const isRej = d.rawStatus === "rejected";
                                return (
                                    <tr key={idx}>
                                        <td className="py-3 pr-4 text-sm text-gray-800">{d.label}</td>
                                        <td className="py-3 pr-4">
                                            {isDone ? (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600"><CheckCircle2 size={13} /> ผ่านแล้ว</span>
                                            ) : isActive ? (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600"><Clock size={13} /> กำลังดำเนินการ</span>
                                            ) : isRej ? (
                                                <span className="flex items-center gap-1.5 text-sm font-medium text-red-500"><X size={13} /> ส่งกลับแก้ไข</span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-sm text-gray-400"><Circle size={12} /> ยังไม่ดำเนินการ</span>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 text-sm text-gray-500 whitespace-nowrap">{d.date || "—"}</td>
                                        <td className="py-3 text-sm text-gray-400">{d.note === "-" ? "—" : d.note}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

// =========================
// COURSE CARD  (รูปที่ 1 & 2)
// =========================

const CourseCard = ({ item, onSelect }) => {
    const cfg = statusConfig[item.statusColor] || statusConfig.gray;
    const typeLabel = getCurriculumTypeLabel(item.curriculumType);
    const isRejected = item.statusColor === "red";

    return (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md">

            {/* TOP */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 leading-snug">{item.courseName}</h3>
                    <p className="mt-0.5 text-sm text-gray-400">{item.faculty}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {typeLabel && (
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${typeLabel.cls}`}>
                            {typeLabel.label}
                        </span>
                    )}
                    <span className="text-sm text-gray-400">พ.ศ. {item.patchYear}</span>
                    {isRejected && (
                        <span className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                            ต้องปรับปรุง
                        </span>
                    )}
                    <button
                        onClick={() => onSelect(item)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                        <Eye size={15} className="text-blue-500" />
                        ดูรายละเอียด
                    </button>
                </div>
            </div>

            {/* STATUS + PROGRESS BAR */}
            <div className="mt-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        สถานะ:{" "}
                        <span className={`font-semibold ${cfg.text}`}>{item.status}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        ความคืบหน้า: <span className="font-bold text-gray-800">{item.progress}%</span>
                    </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${isRejected ? "bg-red-500" : "bg-green-500"}`}
                        style={{ width: `${item.progress}%` }}
                    />
                </div>
            </div>

            {/* TIMELINE */}
            <div className="mt-5">
                <Timeline processes={item.rawProcesses} />
            </div>
        </div>
    );
};

// =========================
// MAIN PAGE
// =========================

export const Status = () => {

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [search, setSearch] = useState("");
    const [facultyFilter, setFacultyFilter] = useState("ทั้งหมด");
    const [faculties, setFaculties] = useState(["ทั้งหมด"]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const itemsPerPage = 5;

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get("/courses");
            const mapped = res.data.data.map((course) => {
                const processes = course.curriculumProcesses || [];
                const doneCount = processes.filter((p) => p.status === "done").length;
                const currentIdx = processes.findIndex((p) => p.status === "current");
                return {
                    id: course.curriculum_id,
                    courseName: course.curriculum_name_th,
                    faculty: course.departments?.faculties?.faculty_name_th || "-",
                    patchYear: course.curriculum_year,
                    curriculumType: course.curriculum_type,
                    status:
                        processes.find((p) => p.status === "current")?.step_name ||
                        processes.find((p) => p.status === "rejected")?.step_name ||
                        (processes.length && doneCount === processes.length ? "เริ่มใช้หลักสูตร" : "ยังไม่ดำเนินการ"),
                    statusColor: getStatusColor(processes),
                    progress:
                        processes.length > 0
                            ? Math.round((doneCount / processes.length) * 100)
                            : 0,
                    currentStep: currentIdx >= 0 ? currentIdx : doneCount - 1,
                    rawProcesses: processes,
                    details: processes.map((p) => ({
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

            const facultyList = res.data.data
                .map((c) => c.departments?.faculties?.faculty_name_th)
                .filter(Boolean);
            setFaculties(["ทั้งหมด", ...new Set(facultyList)]);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const filtered = useMemo(() => {
        return documents.filter((item) => {
            const keyword = search.toLowerCase().trim();
            const matchSearch = !keyword || item.courseName?.toLowerCase().includes(keyword);
            const matchFaculty = facultyFilter === "ทั้งหมด" || item.faculty === facultyFilter;
            return matchSearch && matchFaculty;
        });
    }, [documents, search, facultyFilter]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <TeacherLayout>
            <div className="min-h-screen bg-gray-50">

                {/* ── GRADIENT HERO ── */}
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-500 px-8 py-8 ">
                    <h1 className="text-2xl font-bold text-white">ติดตามสถานะหลักสูตร</h1>
                    <p className="mt-1 text-sm text-blue-100">ติดตามความคืบหน้าของหลักสูตรในแต่ละขั้นตอนการพัฒนา</p>
                </div>

                <div className="mx-auto max-w-5xl px-6 py-6 space-y-4">

                    {/* ── INFO BANNER ──
                    <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <Info size={16} className="shrink-0 text-blue-500" />

                    </div> */}

                    {/* ── SEARCH + FILTER ── */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value.trimStart()); setCurrentPage(1); }}
                                    placeholder="ค้นหาชื่อหลักสูตร..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="relative w-52">
                                <select
                                    value={facultyFilter}
                                    onChange={(e) => { setFacultyFilter(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:bg-white"
                                >
                                    {faculties.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            <button
                                onClick={() => { setCurrentPage(1); fetchCourses(); }}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                            >
                                ค้นหา
                            </button>
                        </div>
                    </div>

                    {/* ── LOADING ── */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-14">
                            <div className="relative h-10 w-10">
                                <div className="h-10 w-10 rounded-full border-4 border-blue-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                    )}

                    {/* ── CARDS ── */}
                    {!loading && (
                        <div className="space-y-4">
                            {paginated.length === 0 && hasSearched && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-14">
                                    <p className="text-sm text-gray-400">ไม่พบข้อมูลหลักสูตร</p>
                                </div>
                            )}
                            {paginated.map((item) => (
                                <CourseCard key={item.id} item={item} onSelect={setSelectedItem} />
                            ))}
                        </div>
                    )}

                    {/* ── PAGINATION ── */}
                    {totalPages > 1 && !loading && (
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-gray-400">
                                แสดง {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} จาก {filtered.length} รายการ
                            </p>
                            <div className="flex gap-1.5">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${currentPage === page
                                            ? "bg-blue-600 text-white"
                                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {selectedItem && (
                <TrackingDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </TeacherLayout>
    );
};