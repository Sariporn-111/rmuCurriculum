import { MainLayout } from "../../components/MainLayout";
import SMO08Modal from "../../components/officer/SMO08Modal";
import Swal from "sweetalert2";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    FileText,
    FolderOpen,
    Download,
    ExternalLink,
    GitCompare,
    X,
    ChevronDown,
} from "lucide-react";

import { useState, useEffect } from "react";

import api from "../../services/api";

import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";
import LoadingSpinner from "../../components/ui/LoadingSpinner";


// ─────────────────────────────────────────────
// Skeleton Loading
// ─────────────────────────────────────────────
const TableSkeleton = () => {
    return (
        <>
            {[...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((__, idx) => (
                        <td key={idx} className="px-4 py-4">
                            <div className="h-4 rounded bg-gray-200/70" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};


// ─────────────────────────────────────────────
// Compare Modal
// ─────────────────────────────────────────────
const CompareModal = ({
    open,
    onClose,
    data,
    curriculums,
}) => {

    const [selectedCurriculumId, setSelectedCurriculumId] =
        useState("");

    const [roundA, setRoundA] = useState("");
    const [roundB, setRoundB] = useState("");

    useEffect(() => {
        if (open) {
            setSelectedCurriculumId("");
            setRoundA("");
            setRoundB("");
        }
    }, [open]);

    if (!open) return null;

    const filtered = data.filter((item) => {
        const name = item.tb_curriculum?.curriculum_name_th?.toLowerCase() ?? "";
        const faculty = item.tb_curriculum?.departments?.faculties?.faculty_name_th?.toLowerCase() ?? "";

        const matchSearch = !search || name.includes(search.toLowerCase());
        const matchFaculty = !facultyFilter || faculty.includes(facultyFilter.toLowerCase());

        return matchSearch && matchFaculty;
    });

    const itemA = filteredRounds.find(
        (item) =>
            String(item.smo08_id) === String(roundA)
    );

    const itemB = filteredRounds.find(
        (item) =>
            String(item.smo08_id) === String(roundB)
    );

    const canCompare =
        itemA &&
        itemB &&
        roundA !== roundB;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                            <GitCompare
                                size={18}
                                className="text-blue-600"
                            />
                            เปรียบเทียบ สมอ.08
                        </h2>

                        <p className="mt-0.5 text-xs text-gray-400">
                            เลือกหลักสูตรและรอบที่ต้องการเปรียบเทียบ
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* CONTROLS */}
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">

                    <div className="flex flex-wrap items-end gap-4">

                        {/* COURSE */}
                        <div className="min-w-[220px] flex-1">
                            <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                เลือกหลักสูตร
                            </label>

                            <div className="relative">
                                <select
                                    value={selectedCurriculumId}
                                    onChange={(e) => {
                                        setSelectedCurriculumId(
                                            e.target.value
                                        );

                                        setRoundA("");
                                        setRoundB("");
                                    }}
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        -- เลือกหลักสูตร --
                                    </option>

                                    {curriculums.map((c) => (
                                        <option
                                            key={c.curriculum_id}
                                            value={c.curriculum_id}
                                        >
                                            {c.curriculum_name_th}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>
                        </div>

                        {/* ROUND A */}
                        <div className="min-w-[180px] flex-1">
                            <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                รอบที่ 1
                            </label>

                            <div className="relative">
                                <select
                                    value={roundA}
                                    onChange={(e) =>
                                        setRoundA(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        !selectedCurriculumId
                                    }
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                >
                                    <option value="">
                                        -- เลือกรอบ --
                                    </option>

                                    {filteredRounds.map((item) => (
                                        <option
                                            key={item.smo08_id}
                                            value={item.smo08_id}
                                        >
                                            รอบที่ {item.improve_round}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>
                        </div>

                        {/* VS */}
                        <div className="pb-2 text-sm font-bold text-gray-400">
                            VS
                        </div>

                        {/* ROUND B */}
                        <div className="min-w-[180px] flex-1">
                            <label className="mb-1.5 block text-xs font-medium text-gray-500">
                                รอบที่ 2
                            </label>

                            <div className="relative">
                                <select
                                    value={roundB}
                                    onChange={(e) =>
                                        setRoundB(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        !selectedCurriculumId
                                    }
                                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                                >
                                    <option value="">
                                        -- เลือกรอบ --
                                    </option>

                                    {filteredRounds.map((item) => (
                                        <option
                                            key={item.smo08_id}
                                            value={item.smo08_id}
                                        >
                                            รอบที่ {item.improve_round}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-hidden">

                    {!canCompare ? (
                        <div className="flex h-full min-h-[350px] items-center justify-center text-gray-400">

                            <div className="text-center">
                                <GitCompare
                                    size={40}
                                    className="mx-auto mb-3 text-gray-200"
                                />

                                <p className="text-sm">
                                    เลือกไฟล์ 2 รอบเพื่อเปรียบเทียบ
                                </p>
                            </div>
                        </div>

                    ) : (

                        <div className="grid h-full grid-cols-2 divide-x divide-gray-200">

                            {/* A */}
                            <div className="flex flex-col">

                                <div className="border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                                    <p className="text-xs font-semibold text-blue-700">
                                        รอบที่ {itemA.improve_round}
                                    </p>
                                </div>

                                <iframe
                                    src={`${import.meta.env.VITE_API_URL}${itemA.file_path}`}
                                    className="flex-1 w-full"
                                    title="A"
                                />
                            </div>

                            {/* B */}
                            <div className="flex flex-col">

                                <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
                                    <p className="text-xs font-semibold text-emerald-700">
                                        รอบที่ {itemB.improve_round}
                                    </p>
                                </div>

                                <iframe
                                    src={`${import.meta.env.VITE_API_URL}${itemB.file_path}`}
                                    className="flex-1 w-full"
                                    title="B"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const Revise = () => {

    const [data, setData] = useState([]);
    const [curriculums, setCurriculums] =
        useState([]);

    const [openModal, setOpenModal] =
        useState(false);

    const [openCompare, setOpenCompare] =
        useState(false);

    const [editData, setEditData] =
        useState(null);

    const [search, setSearch] =
        useState("");

    const [facultyFilter, setFacultyFilter] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    useEffect(() => {
        fetchData();
        fetchCurriculums();
    }, []);


    const fetchData = async () => {

        setLoading(true);

        try {

            const res = await api.get("/smo08");

            setData(res.data.data || []);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);
        }
    };


    const fetchCurriculums = async () => {

        try {

            const res = await api.get("/courses");

            setCurriculums(
                res.data.data || []
            );

        } catch (err) {

            console.error(err);
        }
    };


    // แสดงเฉพาะหลักสูตรปรับปรุง (ไม่จำกัดว่าต้องเผยแพร่แล้ว)
    // ✅ แก้เป็น curriculum_status
    const revisedCurriculums = curriculums.filter(
        c => c.curriculum_status === "revised"
    );


    const handleSave = async (form) => {
        try {
            const formData = new FormData();
            formData.append("curriculum_id", form.curriculum_id);
            if (form.note) formData.append("note", form.note);
            if (form.file instanceof File) formData.append("file", form.file);

            if (editData) {
                await api.put(`/smo08/${editData.smo08_id}`, formData);
                Swal.fire("สำเร็จ", "แก้ไขข้อมูลแล้ว", "success");
            } else {
                await api.post("/smo08", formData);
                Swal.fire("สำเร็จ", "เพิ่มข้อมูลแล้ว", "success");
            }
            fetchData();
            setOpenModal(false);
            setEditData(null);
        } catch (err) {
            Swal.fire("ผิดพลาด", err.response?.data?.error || "เกิดข้อผิดพลาด", "error");
        }
    };

    const handleDelete = async (id) => {

        const result = await Swal.fire({
            title: "ยืนยันการลบ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบ",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;

        try {

            await api.delete(`/smo08/${id}`);

            fetchData();

            Swal.fire(
                "ลบแล้ว",
                "",
                "success"
            );

        } catch {

            Swal.fire(
                "ผิดพลาด",
                "ไม่สามารถลบข้อมูลได้",
                "error"
            );
        }
    };


    // FILTER
    const filtered = data.filter((item) => {

        const name =
            item.tb_curriculum
                ?.curriculum_name_th
                ?.toLowerCase() ?? "";

        const faculty =
            (item.faculty ?? "")
                .toLowerCase();

        const matchSearch =
            !search ||
            name.includes(
                search.toLowerCase()
            );

        const matchFaculty =
            !facultyFilter ||
            faculty.includes(
                facultyFilter.toLowerCase()
            );

        return (
            matchSearch &&
            matchFaculty
        );
    });


    // PAGINATION
    const {
        page,
        setPage,
        totalPages,
        paginated,
    } = usePagination(filtered, 10);


    // STATS
    const totalDocs = data.length;

    const withFile = data.filter(
        (d) => d.file_path
    ).length;

    const uniqueYears =
        new Set(
            data
                .map((d) => d.year)
                .filter(Boolean)
        ).size;


    return (
        <MainLayout role="officer">

            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">

                <div className="w-full">

                    {/* HEADER */}
                    <div className="mb-5 flex items-center justify-between">

                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">
                                ข้อมูล สมอ.08
                            </h1>

                            <p className="mt-0.5 text-xs text-gray-400">
                                จัดการข้อมูลการปรับปรุงหลักสูตร
                            </p>
                        </div>

                        <div className="flex items-center gap-2">

                            <button
                                onClick={() =>
                                    setOpenCompare(true)
                                }
                                className="flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                            >
                                <GitCompare size={15} />
                                เปรียบเทียบ
                            </button>

                            <button
                                onClick={() => {
                                    setEditData(null);
                                    setOpenModal(true);
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus size={15} />
                                เพิ่มเอกสาร
                            </button>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <StatCard
                            icon={<FileText size={15} />}
                            label="เอกสารทั้งหมด"
                            value={totalDocs}
                            color="blue"
                        />

                        <StatCard
                            icon={<FolderOpen size={15} />}
                            label="มีไฟล์แนบ"
                            value={withFile}
                            color="emerald"
                        />

                        <StatCard
                            icon={<Search size={15} />}
                            label="จำนวนปี"
                            value={uniqueYears}
                            color="violet"
                        />
                    </div>

                    {/* FILTER */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">

                        <div
                            className="relative flex-1"
                            style={{
                                minWidth: "180px",
                                maxWidth: "320px",
                            }}
                        >
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="ค้นหาชื่อหลักสูตร..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <input
                            type="text"
                            value={facultyFilter}
                            onChange={(e) =>
                                setFacultyFilter(
                                    e.target.value
                                )
                            }
                            placeholder="กรองตามคณะ..."
                            className="w-44 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                        />

                        <span className="ml-auto text-xs text-gray-400">
                            {filtered.length} รายการ
                        </span>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-sm">

                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">

                                        <Th>
                                            ชื่อหลักสูตร
                                        </Th>

                                        <Th>
                                            คณะ
                                        </Th>

                                        <Th>
                                            สาขา
                                        </Th>

                                        <Th>
                                            ปี
                                        </Th>

                                        <Th>
                                            รอบ
                                        </Th>

                                        <Th center>
                                            เอกสาร
                                        </Th>

                                        <Th center>
                                            จัดการ
                                        </Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50">

                                    {loading ? (

                                        <TableSkeleton />

                                    ) : paginated.length === 0 ? (

                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center text-sm text-gray-400"
                                            >
                                                ไม่พบข้อมูล
                                            </td>
                                        </tr>

                                    ) : (

                                        paginated.map((item) => (

                                            <tr
                                                key={item.smo08_id}
                                                className="transition hover:bg-blue-50/30"
                                            >

                                                <td className="px-4 py-3">

                                                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                                                        {
                                                            item
                                                                .tb_curriculum
                                                                ?.curriculum_name_th
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.tb_curriculum?.departments?.faculties?.faculty_name_th || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.tb_curriculum?.departments?.department_name_th || "—"}
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.year}
                                                </td>

                                                <td className="px-4 py-3">

                                                    <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                                                        รอบที่ {item.improve_round}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">

                                                    <div className="flex items-center justify-center gap-3">

                                                        {item.file_path ? (

                                                            <>
                                                                <a
                                                                    href={`${import.meta.env.VITE_API_URL}${item.file_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    Preview
                                                                </a>

                                                                <a

                                                                    href={`${import.meta.env.VITE_API_URL}${item.file_path}`}
                                                                    download
                                                                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                                                                >
                                                                    <Download size={12} />
                                                                    Download
                                                                </a>
                                                            </>

                                                        ) : (

                                                            <span className="text-xs text-gray-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">

                                                    <div className="flex items-center justify-center gap-2">

                                                        <ActionBtn
                                                            onClick={() => {
                                                                setEditData(item);
                                                                setOpenModal(true);
                                                            }}
                                                            hoverColor="hover:text-amber-600 hover:bg-amber-50"
                                                            title="แก้ไข"
                                                        >
                                                            <Pencil size={14} />
                                                        </ActionBtn>

                                                        <ActionBtn
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.smo08_id
                                                                )
                                                            }
                                                            hoverColor="hover:text-red-600 hover:bg-red-50"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={14} />
                                                        </ActionBtn>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {!loading && (
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        )}
                    </div>
                </div>

                {/* MODAL */}
                <SMO08Modal
                    open={openModal}
                    onClose={() => {
                        setOpenModal(false);
                        setEditData(null);
                    }}
                    onSave={handleSave}
                    editData={editData}
                    curriculums={revisedCurriculums}
                />

                {/* COMPARE */}
                <CompareModal
                    open={openCompare}
                    onClose={() =>
                        setOpenCompare(false)
                    }
                    data={data}
                    curriculums={
                        revisedCurriculums
                    }
                />
            </div>
        </MainLayout>
    );
};


// ─────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────
const StatCard = ({
    icon,
    label,
    value,
    color,
}) => {

    const iconColors = {
        blue: "bg-blue-100 text-blue-600",
        emerald:
            "bg-emerald-100 text-emerald-600",
        violet:
            "bg-violet-100 text-violet-600",
    };

    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">

            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}
            >
                {icon}
            </div>

            <div className="min-w-0">
                <p className="truncate text-xs text-gray-400">
                    {label}
                </p>

                <p className="text-base font-bold text-gray-900">
                    {value}
                </p>
            </div>
        </div>
    );
};


const Th = ({
    children,
    center,
}) => (
    <th
        className={`px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 ${center
            ? "text-center"
            : "text-left"
            }`}
    >
        {children}
    </th>
);


const ActionBtn = ({
    children,
    onClick,
    hoverColor,
    title,
}) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition ${hoverColor}`}
    >
        {children}
    </button>
);


export default Revise;