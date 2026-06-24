import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../hooks/useAuth";

export const MainLayout = ({ children }) => {
  const { role, username } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        role={role}
        username={username}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header แสดงเฉพาะ mobile */}
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-1">
          {children}
        </main>
      </div>
    </div>
  );
};