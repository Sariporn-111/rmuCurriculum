import { TeacherLayout } from "../../components/Teacher/TeacherLayout";
import { Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const TeacherDashboard = () => {
  const { username } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    {
      icon: <Search size={28} />,
      label: "ค้นหาเอกสาร สมอ.08",
      desc: "ค้นหาเอกสารสมอ.08",
      path: "/teacher/smo08",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <Download size={28} />,
      label: "ดาวน์โหลดเอกสารรับรองคุณวุฒิ",
      desc: "ดาวน์โหลดเอกสารการรับรองคุณวุฒิหลักสูตร",
      path: "/teacher/certification",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <TeacherLayout>
      {/* Welcome card */}
      <div className="border border-gray-200 rounded-2xl p-10 text-center bg-white mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <svg className="w-9 h-9 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ยินดีต้อนรับสู่ระบบฐานข้อมูลหลักสูตรสภาวิชาการ
        </h1>
        <p className="text-gray-400 text-sm">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
      </div>

      {/* Quick links */}
      <p className="text-sm font-semibold text-gray-600 mb-3">เข้าถึงด่วน</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-4 border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition text-left"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </TeacherLayout>
  );
};