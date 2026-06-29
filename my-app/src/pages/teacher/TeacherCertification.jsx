import { TeacherLayout } from "../../components/Teacher/TeacherLayout";
import { useEffect, useMemo, useState } from "react";
import { 
    Search, 
    ChevronDown, 
    FileText, 
    Download, 
    GraduationCap, 
    X,
    Award,
    CheckCircle,
    BookOpen,
    ShieldAlert
} from "lucide-react";
import api from "../../services/api";

export const TeacherCertification = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [facultyFilter, setFacultyFilter] = useState("ทั้งหมด");
    const [departmentFilter, setDepartmentFilter] = useState("ทั้งหมด");
    const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await api.get("/certifications");
            const raw = res.data.data || [];

            const merged = {};
            raw.forEach((item) => {
                const curriculumId = item.curriculum_id;
                if (!merged[curriculumId]) {
                    merged[curriculumId] = {
                        id: curriculumId,
                        courseName: item.tb_curriculum?.curriculum_name_th || "-",
                        faculty: item.tb_curriculum?.departments?.faculties?.faculty_name_th || "-",
                        department: item.tb_curriculum?.departments?.department_name_th || "-",
                        approveDate: item.approve_date?.split("T")[0] || "-",
                        ocscFile: null,
                        otepcFile: null,
                    };
                }
                if (item.certification_type === "OCSC") merged[curriculumId].ocscFile = item.file_path;
                if (item.certification_type === "OTEPC") merged[curriculumId].otepcFile = item.file_path;
            });

            setDocuments(Object.values(merged));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Faculties (unique) ──
    const faculties = useMemo(() => {
        const unique = [...new Set(documents.map(d => d.faculty).filter(Boolean))];
        return ["ทั้งหมด", ...unique.sort()];
    }, [documents]);

    // ── Departments cascade ตาม faculty ──
    const departments = useMemo(() => {
        const filtered = facultyFilter === "ทั้งหมด"
            ? documents
            : documents.filter(d => d.faculty === facultyFilter);
        const unique = [...new Set(filtered.map(d => d.department).filter(f => f && f !== "-"))];
        return ["ทั้งหมด", ...unique.sort()];
    }, [documents, facultyFilter]);

    const handleClearAll = () => {
        setSearch(""); setFacultyFilter("ทั้งหมด"); setDepartmentFilter("ทั้งหมด"); setTypeFilter("ทั้งหมด"); setCurrentPage(1);
    };
    const hasFilter = !!(search || facultyFilter !== "ทั้งหมด" || departmentFilter !== "ทั้งหมด" || typeFilter !== "ทั้งหมด");

    // reset department เมื่อเปลี่ยน faculty
    const handleFacultyChange = (e) => {
        setFacultyFilter(e.target.value);
        setDepartmentFilter("ทั้งหมด");
        setCurrentPage(1);
    };

    // ── Filter ──
    const filteredDocuments = useMemo(() => {
        return documents.filter((item) => {
            const matchSearch = item.courseName?.toLowerCase().includes(search.toLowerCase());
            const matchFaculty = facultyFilter === "ทั้งหมด" || item.faculty === facultyFilter;
            const matchDepartment = departmentFilter === "ทั้งหมด" || item.department === departmentFilter;
            const matchType = typeFilter === "ทั้งหมด"
                || (typeFilter === "กพ." && !!item.ocscFile)
                || (typeFilter === "กพศ." && !!item.otepcFile);
            return matchSearch && matchFaculty && matchDepartment && matchType;
        });
    }, [documents, search, facultyFilter, departmentFilter, typeFilter]);

    // ── Pagination ──
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ── Statistics for Dashboard feel ──
    const stats = useMemo(() => {
        const total = documents.length;
        const withOcsc = documents.filter(d => d.ocscFile).length;
        const withOtepc = documents.filter(d => d.otepcFile).length;
        return { total, withOcsc, withOtepc };
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
                            การรับรองมาตรฐาน
                        </span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ดาวน์โหลดเอกสารรับรองคุณวุฒิ</h1>
                        <p className="text-sm text-emerald-100/90 max-w-xl">
                            ค้นหาและดาวน์โหลดเอกสารรับรองคุณวุฒิหลักสูตรจาก สำนักงาน ก.พ. และ สำนักงาน ก.ค.ศ. ของสถาบัน
                        </p>
                    </div>
                </div>

                {/* 2. STATS ROW (KPI cards to make it less empty) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <Award size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400">หลักสูตรที่ได้รับการรับรองคุณวุฒิ</p>
                            <p className="text-xl font-bold text-gray-800">{stats.total} หลักสูตร</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400">ได้รับการรับรองคุณวุฒิ ก.พ.</p>
                            <p className="text-xl font-bold text-gray-800">{stats.withOcsc} รายการ</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex items-center gap-4 transition hover:shadow-md duration-200">
                        <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                            <FileText size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400">ได้รับการรับรองคุณวุฒิ ก.ค.ศ.</p>
                            <p className="text-xl font-bold text-gray-800">{stats.withOtepc} รายการ</p>
                        </div>
                    </div>
                </div>

                {/* 3. FILTER SECTION */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row">

                        {/* SEARCH */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder="ค้นหาชื่อหลักสูตร เช่น สาขาวิชาบริหารธุรกิจ..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* FACULTY */}
                        <div className="relative lg:w-52">
                            <select value={facultyFilter} onChange={handleFacultyChange}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-8 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                {faculties.map(f => <option key={f} value={f}>{f === "ทั้งหมด" ? "— คณะทั้งหมด —" : f}</option>)}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* DEPARTMENT */}
                        <div className="relative lg:w-52">
                            <select value={departmentFilter}
                                onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                                disabled={departments.length <= 1}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-8 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                {departments.map(d => <option key={d} value={d}>{d === "ทั้งหมด" ? "— สาขาทั้งหมด —" : d}</option>)}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* TYPE */}
                        <div className="relative lg:w-40">
                            <select value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-8 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                <option value="ทั้งหมด">— ประเภทรับรอง —</option>
                                <option value="กพ.">ก.พ. (OCSC)</option>
                                <option value="กพศ.">ก.ค.ศ. (OTEPC)</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        
                        {/* ปุ่มล้างทั้งหมด */}
                        {hasFilter && (
                            <button onClick={handleClearAll}
                                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 whitespace-nowrap">
                                <X size={14} /> ล้างทั้งหมด
                            </button>
                        )}

                    </div>

                    {/* Active filter badges */}
                    {(facultyFilter !== "ทั้งหมด" || departmentFilter !== "ทั้งหมด" || typeFilter !== "ทั้งหมด" || search) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-55 pt-3">
                            <span className="text-xs font-semibold text-gray-400">ตัวกรองปัจจุบัน:</span>
                            {facultyFilter !== "ทั้งหมด" && (
                                <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                    คณะ: {facultyFilter}
                                    <button onClick={() => { setFacultyFilter("ทั้งหมด"); setDepartmentFilter("ทั้งหมด"); }} className="ml-1 hover:text-blue-900 font-bold">×</button>
                                </span>
                            )}
                            {departmentFilter !== "ทั้งหมด" && (
                                <span className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                    สาขา: {departmentFilter}
                                    <button onClick={() => setDepartmentFilter("ทั้งหมด")} className="ml-1 hover:text-indigo-900 font-bold">×</button>
                                </span>
                            )}
                            {typeFilter !== "ทั้งหมด" && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-750">
                                    ประเภท: {typeFilter}
                                    <button onClick={() => setTypeFilter("ทั้งหมด")} className="ml-1 hover:text-emerald-900 font-bold">×</button>
                                </span>
                            )}
                            {search && (
                                <span className="flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
                                    คำค้นหา: "{search}"
                                    <button onClick={() => setSearch("")} className="ml-1 hover:text-gray-800 font-bold">×</button>
                                </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">({filteredDocuments.length} รายการที่ตรงกัน)</span>
                        </div>
                    )}
                </div>

                {/* 4. LOADING STATE */}
                {loading && (
                    <div className="rounded-2xl border border-gray-200 bg-white py-20 shadow-sm">
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative h-12 w-12">
                                <div className="h-12 w-12 rounded-full border-4 border-emerald-100" />
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลเอกสารรับรอง...</p>
                        </div>
                    </div>
                )}

                {/* 5. TABLE / GRID SECTION */}
                {!loading && (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-150">
                                <thead className="bg-gray-50/75">
                                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">หลักสูตร</th>
                                        <th className="px-6 py-4">สังกัดคณะ</th>
                                        <th className="px-6 py-4">สาขาวิชา</th>
                                        <th className="px-6 py-4 text-center">วันที่ได้รับการรับรอง</th>
                                        <th className="px-6 py-4 text-center">เอกสารดาวน์โหลด</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {paginatedDocuments.map((item) => (
                                        <tr key={item.id} className="transition duration-150 hover:bg-blue-50/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 rounded-xl bg-emerald-50 p-2 text-emerald-600 flex-shrink-0">
                                                        <GraduationCap size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 leading-snug">{item.courseName}</p>
                                                        <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-100">
                                                    {item.faculty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{item.department}</td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                                {item.approveDate && item.approveDate !== "-" ? item.approveDate : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2.5">
                                                    {item.ocscFile ? (
                                                        <a href={`http://localhost:3000${item.ocscFile}`} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95">
                                                            <Download size={13} /> รับรอง ก.พ.
                                                        </a>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                            <ShieldAlert size={12} className="text-gray-300" /> ไม่มี ก.พ.
                                                        </span>
                                                    )}

                                                    {item.otepcFile ? (
                                                        <a href={`http://localhost:3000${item.otepcFile}`} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-95">
                                                            <FileText size={13} /> รับรอง ก.ค.ศ.
                                                        </a>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                            <ShieldAlert size={12} className="text-gray-300" /> ไม่มี ก.ค.ศ.
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedDocuments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-gray-400">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                                                        <Award size={22} />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-500">ไม่พบข้อมูลเอกสารรับรอง</p>
                                                    <p className="text-xs text-gray-400">ลองค้นหาด้วยคำค้นหาอื่นหรือขยายตัวกรองดูนะครับ</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                                <p className="text-xs text-gray-500 font-medium">
                                    แสดง {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredDocuments.length)} จาก {filteredDocuments.length} รายการ
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button key={page} onClick={() => setCurrentPage(page)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition
                                                ${currentPage === page ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}>
                                            {page}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
};