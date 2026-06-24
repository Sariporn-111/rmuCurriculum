import { TeacherLayout } from "../../components/Teacher/TeacherLayout";

import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Search,
    ChevronDown,
    FileText,
    Download,
    GraduationCap
} from "lucide-react";

import api from "../../services/api";

// =========================
// MAIN
// =========================

export const TeacherCertification = () => {

    // =========================
    // STATES
    // =========================

    const [documents, setDocuments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [facultyFilter, setFacultyFilter] =
        useState("ทั้งหมด");

    const [typeFilter, setTypeFilter] =
        useState("ทั้งหมด");

    const [currentPage, setCurrentPage] =
        useState(1);

    const itemsPerPage = 5;

    // =========================
    // FETCH DATA
    // =========================

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {

        try {

            setLoading(true);

            const res =
                await api.get("/certifications");

            const raw =
                res.data.data || [];
            console.log(raw.map(item => ({
                type: item.certification_type,
                file: item.file_path
            })));
            // =========================
            // MERGE DATA
            // =========================

            const merged = {};

            raw.forEach((item) => {

                const curriculumId =
                    item.curriculum_id;

                if (!merged[curriculumId]) {

                    merged[curriculumId] = {

                        id: curriculumId,

                        courseName:
                            item.tb_curriculum
                                ?.curriculum_name_th || "-",

                        faculty:
                            item.tb_curriculum
                                ?.departments
                                ?.faculties
                                ?.faculty_name_th || "-",

                        approveDate:
                            item.approve_date
                                ?.split("T")[0] || "-",

                        ocscFile: null,
                        otepcFile: null
                    };
                }

                // กพ.
                if (
                    item.certification_type === "OCSC"
                ) {

                    merged[curriculumId].ocscFile =
                        item.file_path;
                }

                // กพศ.
                if (
                    item.certification_type === "OTEPC"
                ) {

                    merged[curriculumId].otepcFile =
                        item.file_path;
                }
            });

            setDocuments(
                Object.values(merged)
            );

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);
        }
    };

    // =========================
    // FACULTIES
    // =========================

    const faculties = useMemo(() => {

        const unique = [
            ...new Set(
                documents.map(
                    (item) => item.faculty
                )
            )
        ];

        return [
            "ทั้งหมด",
            ...unique
        ];

    }, [documents]);

    // =========================
    // FILTER
    // =========================

    const filteredDocuments =
        useMemo(() => {

            return documents.filter((item) => {

                // search
                const matchSearch =
                    item.courseName
                        ?.toLowerCase()
                        .includes(
                            search.toLowerCase()
                        );

                // faculty
                const matchFaculty =
                    facultyFilter === "ทั้งหมด" ||

                    item.faculty ===
                    facultyFilter;

                // type
                let matchType = true;

                if (typeFilter === "กพ.") {

                    matchType =
                        !!item.ocscFile;
                }

                if (typeFilter === "กพศ.") {

                    matchType =
                        !!item.otepcFile;
                }

                return (
                    matchSearch &&
                    matchFaculty &&
                    matchType
                );
            });

        }, [
            documents,
            search,
            facultyFilter,
            typeFilter
        ]);

    // =========================
    // PAGINATION
    // =========================

    const totalPages =
        Math.ceil(
            filteredDocuments.length /
            itemsPerPage
        );

    const paginatedDocuments =
        filteredDocuments.slice(
            (currentPage - 1) *
            itemsPerPage,

            currentPage *
            itemsPerPage
        );

    // =========================
    // UI
    // =========================

    return (

        <TeacherLayout>

            <div className="min-h-screen">

                <div className=" space-y-6">

                    {/* HEADER */}
                    <div>

                        <h1 className="text-2xl font-bold text-black">
                            เอกสารรับรองคุณวุฒิหลักสูตร
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            ดาวน์โหลดเอกสารรับรองคุณวุฒิหลักสูตร
                        </p>

                    </div>

                    {/* FILTER */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

                        <div className="flex flex-col gap-3 lg:flex-row">

                            {/* SEARCH */}
                            <div className="relative flex-1">

                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {

                                        setSearch(
                                            e.target.value
                                        );

                                        setCurrentPage(1);
                                    }}
                                    placeholder="ค้นหาชื่อหลักสูตร..."
                                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                                />

                            </div>

                            {/* FACULTY */}
                            <div className="relative lg:w-64">

                                <select
                                    value={facultyFilter}
                                    onChange={(e) => {

                                        setFacultyFilter(
                                            e.target.value
                                        );

                                        setCurrentPage(1);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                                >

                                    {faculties.map((f) => (

                                        <option
                                            key={f}
                                            value={f}
                                        >
                                            {f}
                                        </option>
                                    ))}

                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                            </div>

                            {/* TYPE */}
                            <div className="relative lg:w-52">

                                <select
                                    value={typeFilter}
                                    onChange={(e) => {

                                        setTypeFilter(
                                            e.target.value
                                        );

                                        setCurrentPage(1);
                                    }}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                                >

                                    <option>
                                        ทั้งหมด
                                    </option>

                                    <option>
                                        กพ.
                                    </option>

                                    <option>
                                        กพศ.
                                    </option>

                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                            </div>

                        </div>

                    </div>

                    {/* LOADING */}
                    {loading && (

                        <div className="rounded-2xl border border-gray-200 bg-white py-20">

                            <div className="flex flex-col items-center justify-center">

                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                                <p className="mt-4 text-sm text-gray-500">
                                    กำลังโหลดข้อมูล...
                                </p>

                            </div>

                        </div>
                    )}

                    {/* TABLE */}
                    {!loading && (

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                            <div className="overflow-x-auto">

                                <table className="min-w-full">

                                    <thead className="bg-gray-50">

                                        <tr className="text-left text-sm text-gray-500">

                                            <th className="px-6 py-4 font-semibold">
                                                หลักสูตร
                                            </th>

                                            <th className="px-6 py-4 font-semibold">
                                                คณะ
                                            </th>

                                            <th className="px-6 py-4 font-semibold">
                                                วันที่รับรอง
                                            </th>

                                            <th className="px-6 py-4 text-center font-semibold">
                                                เอกสาร
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {paginatedDocuments.map((item) => (

                                            <tr
                                                key={item.id}
                                                className="border-t border-gray-100 transition hover:bg-blue-50/40"
                                            >

                                                {/* COURSE */}
                                                <td className="px-6 py-4">

                                                    <div className="flex items-start gap-3">

                                                        <div className="mt-0.5 rounded-xl bg-blue-100 p-2 text-blue-600">

                                                            <GraduationCap size={18} />

                                                        </div>

                                                        <div>

                                                            <p className="text-sm font-semibold text-gray-800">
                                                                {item.courseName}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* FACULTY */}
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.faculty}
                                                </td>

                                                {/* DATE */}
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.approveDate}
                                                </td>

                                                {/* FILES */}
                                                <td className="px-6 py-4">

                                                    <div className="flex items-center justify-center gap-2">

                                                        {/* กพ */}
                                                        {item.ocscFile && (

                                                            <a
                                                                href={`http://localhost:3000${item.ocscFile}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                                                            >

                                                                <Download size={14} />

                                                                กพ.

                                                            </a>
                                                        )}

                                                        {/* กพศ */}
                                                        {item.otepcFile && (

                                                            <a
                                                                href={`http://localhost:3000${item.otepcFile}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                            >

                                                                <FileText size={14} />

                                                                กพศ.

                                                            </a>
                                                        )}

                                                    </div>

                                                </td>

                                            </tr>
                                        ))}

                                        {/* EMPTY */}
                                        {paginatedDocuments.length === 0 && (

                                            <tr>

                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-16 text-center text-sm text-gray-400"
                                                >

                                                    ไม่พบข้อมูลเอกสาร

                                                </td>

                                            </tr>
                                        )}

                                    </tbody>

                                </table>

                            </div>

                            {/* PAGINATION */}
                            {totalPages > 1 && (

                                <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

                                    <p className="text-xs text-gray-400">

                                        แสดง
                                        {" "}
                                        {(currentPage - 1) * itemsPerPage + 1}

                                        –
                                        {
                                            Math.min(
                                                currentPage * itemsPerPage,
                                                filteredDocuments.length
                                            )
                                        }

                                        {" "}
                                        จาก
                                        {" "}
                                        {filteredDocuments.length}
                                        {" "}
                                        รายการ

                                    </p>

                                    <div className="flex items-center gap-1.5">

                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => i + 1
                                        ).map((page) => (

                                            <button
                                                key={page}
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition

                                                ${currentPage === page
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >

                                                {page}

                                            </button>
                                        ))}

                                    </div>

                                </div>
                            )}

                        </div>
                    )}

                </div>

            </div>

        </TeacherLayout>
    );
};