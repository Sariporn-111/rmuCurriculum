import { Menu } from "lucide-react";

export const Header = ({ onMenuToggle }) => {
  return (
    <header className="md:hidden bg-blue-900 text-white h-14 flex items-center px-4 shadow-sm sticky top-0 z-50">
      <button onClick={onMenuToggle} className="text-white mr-3">
        <Menu size={22} />
      </button>
      <div className="leading-tight">
        <p className="text-sm font-semibold">ระบบหลักสูตร</p>
        <p className="text-xs text-blue-300">สภาวิชาการ มรม.</p>
      </div>
    </header>
  );
};