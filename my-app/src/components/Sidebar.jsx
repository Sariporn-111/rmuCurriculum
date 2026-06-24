import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck,
  BookOpen, UserCog, UserCheck,
  FileText, FileBadge, BarChart3, Search, FileSearch,
  LogOut, UserCircle2
} from "lucide-react";
import logo from "../assets/logo_rmu.png";
import { useAuth } from "../hooks/useAuth"; // ✅ ใช้ context แทน
import api from "../services/api";

const MENUS = {
  admin: [
    { label: "แดชบอร์ด", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "จัดการบัญชีผู้ใช้", path: "/admin/users", icon: <Users size={18} /> },

  ],
  officer: [
    { label: "แดชบอร์ด", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "ข้อมูลหลักสูตร", path: "/officer/courses", icon: <BookOpen size={18} /> },
    { label: "กรรมการวิชาการ", path: "/officer/academic-committee", icon: <UserCog size={18} /> },
    { label: "กรรมการหลักสูตร", path: "/officer/course-committee", icon: <UserCheck size={18} /> },
    { label: "สมอ.08", path: "/officer/revise", icon: <FileText size={18} /> },
    { label: "เอกสารรับรองคุณวุฒิ", path: "/officer/certification", icon: <FileBadge size={18} /> },
    { label: "รายงาน", path: "/officer/report", icon: <BarChart3 size={18} /> },
  ],
  teacher: [
    { label: "แดชบอร์ด", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "ค้นหา สมอ.08", path: "/teacher/smo08", icon: <FileSearch size={18} /> },
    { label: "เอกสารรับรองคุณวุฒิ", path: "/teacher/certification", icon: <FileBadge size={18} /> },
    { label: "ติดตามสถานะหลักสูตร", path: "/teacher/status", icon: <Search size={18} /> },
  ],
};

const ROLE_LABELS = {
  admin: "ผู้ดูแลระบบ",
  teacher: "อาจารย์",
  officer: "เจ้าหน้าที่",
};

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname;

  const { user, setUser } = useAuth(); // ✅ ดึงจาก context

  const role = user?.role || "guest";
  const menuItems = MENUS[role] || [];
  const displayName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : "Guest";

  const handleLogout = async () => {
    try {
      await api.post('/logout')

      setUser(null)

      navigate('/')
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed md:static top-0 left-0 h-screen
        w-64 bg-gradient-to-b from-blue-900 to-blue-950 text-gray-100 z-40 flex flex-col
        transition-transform duration-300 shadow-xl
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-blue-700/50">
          <img src={logo} alt="logo" className="w-14 h-14 object-contain" />
          <div className="text-center">
            <p className="text-sm font-bold">ระบบฐานข้อมูลหลักสูตร</p>
            <p className="text-xs text-blue-300">สภาวิชาการ มหาวิทยาลัยราชภัฏมหาสารคาม</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = current === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-5 py-2.5 text-sm transition-all
                  ${isActive
                    ? "bg-white/15 border-l-4 border-white text-white font-medium"
                    : "text-blue-200 hover:bg-white/10 hover:text-white border-l-4 border-transparent"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <div className="border-t border-blue-700/50 p-4 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-white text-blue-900 font-bold text-sm flex items-center justify-center uppercase">
              {displayName?.[0] ?? "?"}
            </div>

            {/* Name */}
            <div className="leading-tight overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {displayName || "ไม่พบชื่อ"}
              </p>
              <p className="text-xs text-blue-300">
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
          </div>

          {/* Profile */}
          <button
            onClick={() => {
              onClose?.();
              navigate("/profile");
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white rounded-lg"
          >
            <UserCircle2 size={17} />
            โปรไฟล์ของฉัน
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-200 hover:bg-red-500/20 hover:text-red-300 rounded-lg"
          >
            <LogOut size={17} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
};