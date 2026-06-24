import { Pencil, Trash2 } from "lucide-react";

const RESPONSIBILITY_LABEL = {
    responsible: { label: "ผู้รับผิดชอบ", class: "bg-blue-100 text-blue-700" },
    member: { label: "ประจำหลักสูตร", class: "bg-green-100 text-green-700" },
};

export const CommitteeTable = ({ data, selectedCourseId, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-500">
                    <tr>
                        <th className="p-3 text-left">ชื่ออาจารย์</th>
                        <th className="p-3 text-left">ตำแหน่ง</th>
                        <th className="p-3 text-left">หน้าที่ในหลักสูตร</th>
                        <th className="p-3 text-left">ความรับผิดชอบ</th>
                        <th className="p-3 text-left">คุณวุฒิ</th>
                        <th className="p-3 text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-5 text-center text-gray-400">
                                {selectedCourseId ? "ไม่พบข้อมูลกรรมการ" : "กรุณาเลือกหลักสูตร"}
                            </td>
                        </tr>
                    ) : data.map((item) => (
                        <tr key={item.committee_id} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                                {item.teachers?.title_name}{item.teachers?.first_name_th} {item.teachers?.last_name_th}
                            </td>
                            <td className="p-3">{item.teachers?.academic_position || "-"}</td>
                            <td className="p-3 font-medium">{item.committee_role}</td>

                            {/* ✅ เพิ่ม badge ความรับผิดชอบ */}
                            <td className="p-3">
                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${RESPONSIBILITY_LABEL[item.responsibility]?.class ?? "bg-gray-100 text-gray-600"}`}>
                                    {RESPONSIBILITY_LABEL[item.responsibility]?.label ?? item.responsibility}
                                </span>
                            </td>

                            <td className="p-3 text-gray-600">
                                {item.teachers?.highest_degree} {item.teachers?.major_degree || ""}
                            </td>
                            <td className="p-3 text-center">
                                <div className="flex justify-center gap-3">
                                    <button onClick={() => onEdit(item)} className="hover:text-yellow-600">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => onDelete(item.committee_id)} className="hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};