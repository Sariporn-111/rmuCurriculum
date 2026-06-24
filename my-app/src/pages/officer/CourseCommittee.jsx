import React, { useState, useEffect } from "react";
import { MainLayout } from "../../components/MainLayout";
import Swal from "sweetalert2";
import {
    Plus,
    ChevronDown,
    Users,
    UserCheck,
    Shield,
} from "lucide-react";

import api from "../../services/api";

import { CommitteeTable } from "../../components/officer/CourseCommittee/CommitteeTable";
import { CommitteeModal } from "../../components/officer/CourseCommittee/CommitteeModal";

import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";
import SkeletonTable from "../../components/ui/SkeletonTable";

const CourseCommittee = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");

    const [data, setData] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const [responsibilityFilter, setResponsibilityFilter] =
        useState("ทั้งหมด");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            fetchCommittee(selectedCourseId);
        } else {
            setData([]);
        }
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await api.get("/courses");
            setCourses(res.data.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get("/teachers");
            setTeachers(res.data.data || res.data || []);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchCommittee = async (courseId) => {
        setLoading(true);

        try {
            const res = await api.get(
                `/courses/${courseId}/committee`
            );

            setData(res.data);

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter((item) => {
        if (responsibilityFilter === "ทั้งหมด") {
            return true;
        }

        return (
            item.responsibility ===
            responsibilityFilter
        );
    });

    const {
        page,
        setPage,
        totalPages,
        paginated,
    } = usePagination(filteredData, 10);

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
            await api.delete(`/committee/${id}`);

            await fetchCommittee(selectedCourseId);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "ลบสำเร็จ",
                showConfirmButton: false,
                timer: 2000,
            });

        } catch (err) {
            Swal.fire(
                "ผิดพลาด",
                "ไม่สามารถลบข้อมูลได้",
                "error"
            );
        }
    };

    // stats
    const totalMembers = data.length;

    const responsibleCount = data.filter(
        (d) => d.responsibility === "responsible"
    ).length;

    const memberCount = data.filter(
        (d) => d.responsibility === "member"
    ).length;

    const selectedCourseName = courses.find(
        (c) =>
            String(c.curriculum_id) ===
            String(selectedCourseId)
    )?.curriculum_name_th;

    return (
        <MainLayout role="officer">
            <div className="min-h-screen bg-gray-50/80 px-5 py-5 xl:px-8">
                <div className="w-full">

                    {/* HEADER */}
                    <div className="mb-5 flex items-center justify-between">

                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">
                                กรรมการหลักสูตร
                            </h1>

                            <p className="mt-0.5 text-xs text-gray-400">
                                จัดการข้อมูลกรรมการประจำหลักสูตร
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setEditData(null);
                                setOpenModal(true);
                            }}
                            disabled={!selectedCourseId}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Plus size={15} />
                            เพิ่มกรรมการ
                        </button>
                    </div>

                    {/* COURSE SELECTOR */}
                    <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

                        <p className="mb-2 text-xs font-medium text-gray-400">
                            เลือกหลักสูตร
                        </p>

                        <div className="relative max-w-sm">
                            <select
                                value={selectedCourseId}
                                onChange={(e) => {
                                    setSelectedCourseId(
                                        e.target.value
                                    );

                                    setResponsibilityFilter(
                                        "ทั้งหมด"
                                    );

                                    setPage(1);
                                }}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3.5 pr-9 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">
                                    -- เลือกหลักสูตร --
                                </option>

                                {courses.map((c) => (
                                    <option
                                        key={c.curriculum_id}
                                        value={c.curriculum_id}
                                    >
                                        {c.curriculum_name_th}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown
                                size={13}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                        </div>

                        {selectedCourseName && (
                            <p className="mt-2 text-xs font-medium text-blue-500">
                                {selectedCourseName}
                            </p>
                        )}
                    </div>

                    {/* STAT */}
                    {selectedCourseId && (
                        <div className="mb-5 grid grid-cols-3 gap-3">

                            <StatCard
                                icon={<Users size={15} />}
                                label="กรรมการทั้งหมด"
                                value={totalMembers}
                                color="blue"
                            />

                            <StatCard
                                icon={<Shield size={15} />}
                                label="ผู้รับผิดชอบหลักสูตร"
                                value={responsibleCount}
                                color="violet"
                            />

                            <StatCard
                                icon={<UserCheck size={15} />}
                                label="อาจารย์ประจำหลักสูตร"
                                value={memberCount}
                                color="emerald"
                            />
                        </div>
                    )}

                    {/* CONTENT */}
                    {selectedCourseId && (
                        <>
                            {/* FILTER */}
                            <div className="mb-4 flex items-center gap-3">

                                <div className="relative">
                                    <select
                                        value={responsibilityFilter}
                                        onChange={(e) => {
                                            setResponsibilityFilter(
                                                e.target.value
                                            );

                                            setPage(1);
                                        }}
                                        className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm text-gray-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="ทั้งหมด">
                                            ทั้งหมด
                                        </option>

                                        <option value="responsible">
                                            ผู้รับผิดชอบหลักสูตร
                                        </option>

                                        <option value="member">
                                            อาจารย์ประจำหลักสูตร
                                        </option>
                                    </select>

                                    <ChevronDown
                                        size={13}
                                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                </div>

                                <span className="ml-auto text-xs text-gray-400">
                                    {filteredData.length} รายการ
                                </span>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                                {loading ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <SkeletonTable rows={6} cols={5} />
                                        </table>
                                    </div>
                                ) : paginated.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                                            <Users
                                                size={22}
                                                className="text-gray-400"
                                            />
                                        </div>

                                        <p className="text-sm font-medium text-gray-500">
                                            ไม่พบข้อมูลกรรมการ
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            ไม่มีข้อมูลตามตัวกรองที่เลือก
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <CommitteeTable
                                            data={paginated}
                                            selectedCourseId={
                                                selectedCourseId
                                            }
                                            onEdit={(item) => {
                                                setEditData(item);
                                                setOpenModal(true);
                                            }}
                                            onDelete={handleDelete}
                                        />

                                        <Pagination
                                            page={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* EMPTY STATE */}
                    {!selectedCourseId && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">

                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                                <Users
                                    size={22}
                                    className="text-gray-400"
                                />
                            </div>

                            <p className="text-sm font-medium text-gray-500">
                                เลือกหลักสูตรเพื่อดูรายชื่อกรรมการ
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                ข้อมูลกรรมการจะแสดงหลังจากเลือกหลักสูตรด้านบน
                            </p>
                        </div>
                    )}
                </div>

                {/* MODAL */}
                <CommitteeModal
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    onSuccess={() =>
                        fetchCommittee(selectedCourseId)
                    }
                    editData={editData}
                    selectedCourseId={selectedCourseId}
                    teachers={teachers}
                    onTeacherAdded={fetchTeachers}
                />
            </div>
        </MainLayout>
    );
};

const StatCard = ({
    icon,
    label,
    value,
    color,
}) => {
    const iconColors = {
        blue: "bg-blue-100 text-blue-600",
        violet: "bg-violet-100 text-violet-600",
        emerald: "bg-emerald-100 text-emerald-600",
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

export default CourseCommittee;