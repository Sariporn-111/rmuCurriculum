import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
    Menu,
    X,
    LogOut,
    LayoutDashboard,
    FileSearch,
    FileBadge,
    Search,
    UserCircle2,
} from "lucide-react";

import logo from "../../assets/logo_rmu.png";
import api from "../../services/api";

const MENUS = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "เอกสาร สมอ.08", path: "/teacher/smo08", icon: <FileSearch size={18} /> },
    { label: "เอกสารรับรองคุณวุฒิ", path: "/teacher/teachercertification", icon: <FileBadge size={18} /> },
    { label: "ติดตามสถานะ", path: "/teacher/status", icon: <Search size={18} /> },
];

export const TeacherLayout = ({ children }) => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const current = location.pathname;

    const [mobileOpen, setMobileOpen] = useState(false);

    const displayName = user
        ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
        : "Guest";

    const handleLogout = async () => {
        try {
            await api.post("/logout");
        } catch { }
        setUser(null);
        navigate("/");
    };

    return (
        <div className="flex min-h-screen bg-slate-50">

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-40 flex h-screen w-64 flex-col
                   bg-gradient-to-b from-blue-900 to-blue-950 text-gray-100 shadow-xl
                    transition-transform duration-300
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {/* Logo */}
                <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-blue-700/50">
                    <img src={logo} alt="logo" className="w-14 h-14 object-contain" />
                    <div className="text-center">
                        <p className="text-sm font-bold">ระบบฐานข้อมูลหลักสูตร</p>
                        <p className="text-xs text-blue-300">สภาวิชาการ มหาวิทยาลัยราชภัฏมหาสารคาม</p>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto py-3">
                    {MENUS.map((item) => {
                        const isActive = current === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 border-l-4 px-5 py-2.5 text-sm transition-all
                                    ${isActive
                                        ? "border-white bg-white/15 font-medium text-white"
                                        : "border-transparent text-blue-200 hover:bg-white/10 hover:text-white"
                                    }
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile footer */}
                <div className="border-t border-blue-700/50 p-4 space-y-1">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold uppercase text-blue-900">
                            {displayName?.[0] ?? "?"}
                        </div>
                        <div className="overflow-hidden leading-tight">
                            <p className="truncate text-sm font-medium text-white">{displayName}</p>
                            <p className="text-xs text-blue-300">อาจารย์</p>
                        </div>
                    </div>

                    {/* จัดการข้อมูลส่วนตัว */}
                    <Link
                        to="/teacher/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-white/10 hover:text-white"
                    >
                        <UserCircle2 size={17} />
                        จัดการข้อมูลส่วนตัว
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-200 hover:bg-red-500/20 hover:text-red-300"
                    >
                        <LogOut size={17} />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex flex-1 flex-col md:ml-64">

                {/* Mobile top bar */}
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-blue-800/30 bg-gradient-to-r from-[#17348C] to-[#1E40AF] px-4 text-white md:hidden">
                    <button onClick={() => setMobileOpen((v) => !v)}>
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="text-sm font-semibold">ระบบฐานข้อมูลหลักสูตร</span>
                </header>

                {/* Page content */}
                <main className=" w-full flex-1 px-6 py-8">
                    {children}
                </main>
            </div>
        </div>
    );
};