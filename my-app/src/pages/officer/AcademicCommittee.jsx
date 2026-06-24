import { useState, useEffect } from "react";
import { MainLayout } from "../../components/MainLayout";
import AcademicModal from "../../components/officer/AcademicModal";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Search, Users, UserCheck } from "lucide-react";
import api from "../../services/api";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";
import SkeletonTable from "../../components/ui/SkeletonTable";

const AcademicCommittee = () => {
    const [data, setData] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
        fetchTeachers();
    }, []);

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (params.search) query.append("search", params.search);
            if (params.role) query.append("role", params.role);
            const res = await api.get(`/academic-committee?${query.toString()}`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get("/teachers");
            setTeachers(res.data.data || res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = () => fetchData({ search, role: roleFilter });

    const handleSave = async (form) => {
        try {
            const payload = {
                teacher_id: Number(form.teacher_id),
                role: form.role,
                duty: form.duty || "",
                appointed_date: form.appointed_date || null,
                end_date: form.end_date || null,
                is_active: form.is_active,
            };
            if (editData) {
                await api.put(`/academic-committee/${editData.id}`, payload);
                Swal.fire("สำเร็จ", "แก้ไขข้อมูลแล้ว", "success");
            } else {
                await api.post("/academic-committee", payload);
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
            title: "ยืนยันการลบ", icon: "warning",
            showCancelButton: true, confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก",
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/academic-committee/${id}`);
                fetchData();
                Swal.fire("ลบแล้ว", "", "success");
            } catch {
                Swal.fire("ผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
            }
        }
    };

    const totalCount = data.length;
    const activeCount = data.filter(d => d.is_active).length;
    const inactiveCount = data.length - activeCount;

    const filtered = data.filter((item) => {
        const fullName = `${item.teachers?.title_name ?? ""}${item.teachers?.first_name_th ?? ""} ${item.teachers?.last_name_th ?? ""}`.toLowerCase();
        const matchSearch = !search || fullName.includes(search.toLowerCase());
        const matchRole = !roleFilter || (item.role ?? "").toLowerCase().includes(roleFilter.toLowerCase());
        return matchSearch && matchRole;
    });

    const { page, setPage, totalPages, paginated } = usePagination(filtered, 10);

    return (
        <MainLayout role="officer">
            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">
                <div className="w-full">

                    {/* ── HEADER ── */}
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">กรรมการวิชาการ</h1>
                            <p className="mt-0.5 text-xs text-gray-400">จัดการข้อมูลกรรมการวิชาการ</p>
                        </div>
                        <button
                            onClick={() => { setEditData(null); setOpenModal(true); }}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                        >
                            <Plus size={15} />
                            เพิ่มกรรมการ
                        </button>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="mb-5 grid grid-cols-3 gap-3">
                        <StatCard icon={<Users size={15} />} label="กรรมการทั้งหมด" value={totalCount} color="blue" />
                        <StatCard icon={<UserCheck size={15} />} label="ดำรงตำแหน่ง" value={activeCount} color="emerald" />
                        <StatCard icon={<Trash2 size={15} />} label="พ้นตำแหน่งแล้ว" value={inactiveCount} color="gray" />
                    </div>

                    {/* ── FILTER BAR ── */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="relative flex-1" style={{ minWidth: "180px", maxWidth: "300px" }}>
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="ค้นหาชื่อ..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="บทบาท เช่น ประธาน..."
                                className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-3 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-48"
                            />
                        </div>

                        <button
                            onClick={handleSearch}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                        >
                            <Search size={13} />
                            ค้นหา
                        </button>

                        <button
                            onClick={() => { setSearch(""); setRoleFilter(""); fetchData(); }}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
                        >
                            รีเซ็ต
                        </button>

                        <span className="ml-auto text-xs text-gray-400">{filtered.length} รายการ</span>
                    </div>

                    {/* ── TABLE ── */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <Th>อาจารย์</Th>
                                        <Th>ตำแหน่งวิชาการ</Th>
                                        <Th>บทบาท</Th>
                                        <Th>หน้าที่</Th>
                                        <Th>วันที่แต่งตั้ง</Th>
                                        <Th center>สถานะ</Th>
                                        <Th center>จัดการ</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">

                                    {loading ? (
                                        <SkeletonTable rows={6} cols={7} />

                                    ) : paginated.length === 0 ? (

                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center text-sm text-gray-400"
                                            >
                                                ไม่พบข้อมูลกรรมการวิชาการ
                                            </td>
                                        </tr>

                                    ) : (
                                        paginated.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-blue-50/30"
                                            >

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">

                                                        {item.teachers?.profile_image ? (
                                                            <img
                                                                src={`http://localhost:3000${item.teachers.profile_image}`}
                                                                alt="profile"
                                                                className="h-8 w-8 rounded-full border border-gray-200 object-cover shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                                                {item.teachers?.first_name_th?.[0]}
                                                            </div>
                                                        )}

                                                        <span className="text-sm font-medium text-gray-800">
                                                            {item.teachers?.title_name}
                                                            {item.teachers?.first_name_th}{" "}
                                                            {item.teachers?.last_name_th}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {item.teachers?.academic_position || "-"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                                        {item.role}
                                                    </span>
                                                </td>

                                                <td className="max-w-[180px] truncate px-4 py-3 text-xs text-gray-500">
                                                    {item.duty || "-"}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                                                    {item.appointed_date?.split("T")[0] || "-"}
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.is_active
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : "border-gray-200 bg-gray-50 text-gray-400"
                                                            }`}
                                                    >
                                                        {item.is_active
                                                            ? "ดำรงตำแหน่ง"
                                                            : "พ้นตำแหน่ง"}
                                                    </span>
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
                                                            onClick={() => handleDelete(item.id)}
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

                        {/* ── PAGINATION ── */}
                        {!loading && (
                            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                        )}
                    </div>

                </div>

                <AcademicModal
                    open={openModal}
                    onClose={() => { setOpenModal(false); setEditData(null); }}
                    onSave={handleSave}
                    editData={editData}
                    teachers={teachers}
                />
            </div>
        </MainLayout>
    );
};

const StatCard = ({ icon, label, value, color }) => {
    const iconColors = {
        blue: "bg-blue-100 text-blue-600",
        emerald: "bg-emerald-100 text-emerald-600",
        gray: "bg-gray-100 text-gray-500",
    };
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}>
                {icon}
            </div>
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
    <button
        onClick={onClick}
        title={title}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition ${hoverColor}`}
    >
        {children}
    </button>
);

export default AcademicCommittee;