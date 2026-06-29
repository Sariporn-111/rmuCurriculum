import React, { useEffect, useState } from "react";
import { MainLayout } from "../../components/MainLayout";
import CertificationModal from "../../components/officer/CertificationModal";
import Swal from "sweetalert2";
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    ShieldCheck,
    Download,
    ExternalLink,
} from "lucide-react";

import api from "../../services/api";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";

const Certification = () => {
    const [data, setData] = useState([]);
    const [curriculums, setCurriculums] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCurriculums();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/certifications");
            // console.log("✅ certifications response:", res.data);
            setData(res.data.data || []);
        } catch (err) {
            console.error("fetchData error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurriculums = async () => {
        try {
            const res = await api.get("/courses");
            setCurriculums(res.data.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    // ✅ วิธีที่ง่ายกว่า
    const publishedCurriculums = curriculums.filter((c) => {
        // ถ้ากำลัง edit → รวม curriculum ที่ผูกอยู่เสมอ
        if (editData && c.curriculum_id === editData.curriculum_id) return true;
        return c.curriculumProcesses?.some(
            (p) => p.step_name === "เผยแพร่หลักสูตร" && p.status === "done"
        );
    });
    const handleSave = async (form) => {
        try {
            const fd = new FormData();
            fd.append("curriculum_id", form.curriculum_id);
            fd.append("certification_type", form.certification_type);
            fd.append("agency", form.agency);
            fd.append("recipient", form.recipient || "");
            fd.append("doc_number", form.doc_number || "");
            fd.append("issue_date", form.issue_date || "");
            fd.append("received_date", form.received_date || "");
            fd.append("received_time", form.received_time || "");
            fd.append("request_date", form.request_date || "");
            fd.append("approve_date", form.approve_date || "");
            fd.append("note", form.note || "");
            if (form.file) fd.append("file", form.file);

            if (editData) {
                await api.put(`/certifications/${editData.certification_id}`, fd);
                Swal.fire("สำเร็จ", "แก้ไขข้อมูลแล้ว", "success");
            } else {
                await api.post("/certifications", fd);
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
        if (result.isConfirmed) {
            try {
                await api.delete(`/certifications/${id}`);
                fetchData();
                Swal.fire("ลบแล้ว", "", "success");
            } catch {
                Swal.fire("ผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
            }
        }
    };

    const filtered = data.filter((item) => {
        const name = item.tb_curriculum?.curriculum_name_th?.toLowerCase() ?? "";
        return !search || name.includes(search.toLowerCase());
    });

    const { page, setPage, totalPages, paginated } = usePagination(filtered, 10);

    return (
        <MainLayout role="officer">
            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">
                <div className="w-full">

                    {/* HEADER */}
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">
                                รับรองคุณวุฒิหลักสูตร
                            </h1>
                            <p className="mt-0.5 text-xs text-gray-400">
                                จัดการเอกสารรับรองคุณวุฒิประจำหลักสูตร
                            </p>
                        </div>
                        <button
                            onClick={() => { setEditData(null); setOpenModal(true); }}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                            <Plus size={15} />
                            เพิ่มเอกสาร
                        </button>
                    </div>

                    {/* STAT CARD */}
                    <div className="mb-5">
                        <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <ShieldCheck size={15} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">เอกสารทั้งหมด</p>
                                <p className="text-base font-bold text-gray-900">{data.length} รายการ</p>
                            </div>
                        </div>
                    </div>

                    {/* FILTER */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="relative flex-1" style={{ minWidth: "180px", maxWidth: "320px" }}>
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ค้นหาชื่อหลักสูตร..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{filtered.length} รายการ</span>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <Th>หลักสูตร</Th>
                                        <Th>ประเภท</Th>
                                        <Th>หน่วยงาน</Th>
                                        <Th>เลขที่เอกสาร</Th>
                                        <Th>วันที่ออก</Th>
                                        <Th>วันที่รับ</Th>
                                        <Th>หมายเหตุ</Th>
                                        <Th center>เอกสาร</Th>
                                        <Th center>จัดการ</Th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 9 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <div className="h-3 rounded-full bg-gray-100 animate-pulse" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                                                ไม่พบข้อมูลเอกสารรับรอง
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((item) => (
                                            <tr key={item.certification_id} className="transition hover:bg-blue-50/30">

                                                <td className="px-4 py-3">
                                                    <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                                                        {item.tb_curriculum?.curriculum_name_th}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.certification_type}
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.agency}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-700">
                                                    {item.doc_number || "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                                                    {item.issue_date?.split("T")[0] || "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                                                    {item.received_date?.split("T")[0] || "—"}
                                                </td>

                                                <td className="max-w-[140px] truncate px-4 py-3 text-xs text-gray-500">
                                                    {item.note || "—"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {item.file_path ? (
                                                            <>
                                                                <a
                                                                    href={`http://localhost:3000${item.file_path}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    Preview
                                                                </a>
                                                                <a
                                                                    href={`http://localhost:3000${item.file_path}`}
                                                                    download
                                                                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
                                                                >
                                                                    <Download size={12} />
                                                                    Download
                                                                </a>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">—</span>
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
                                                            onClick={() => handleDelete(item.certification_id)}
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

                        {!loading && (
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        )}
                    </div>
                </div>

                <CertificationModal
                    open={openModal}
                    onClose={() => { setOpenModal(false); setEditData(null); }}
                    onSave={handleSave}
                    editData={editData}
                    curriculums={publishedCurriculums}
                />
            </div>
        </MainLayout>
    );
};

const Th = ({ children, center }) => (
    <th className={`px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 ${center ? "text-center" : "text-left"}`}>
        {children}
    </th>
);

const ActionBtn = ({ children, onClick, hoverColor, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition ${hoverColor}`}
    >
        {children}
    </button>
);

export default Certification;