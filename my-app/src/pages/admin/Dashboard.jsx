import { MainLayout } from "../../components/MainLayout";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { Users, BookOpen, GraduationCap, FileCheck, TrendingUp, Clock } from "lucide-react";
import api from "../../services/api";

Chart.register(...registerables);

const ROLE_COLORS = { admin: "#534AB7", officer: "#639922", teacher: "#378ADD" };
const ROLE_LABELS = { admin: "ผู้ดูแลระบบ", officer: "เจ้าหน้าที่", teacher: "อาจารย์" };
const STATUS_COLORS = { pending: "#EF9F27", approved: "#639922", rejected: "#EF4444" };
const STATUS_LABELS = { pending: "รอดำเนินการ", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const roleRef = useRef(null);
  const statusRef = useRef(null);
  const facultyRef = useRef(null);
  const roleChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const facultyChartRef = useRef(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!data) return;

    const border = "#fff";

    // Role chart
    const roleData = data.users.by_role;
    roleChartRef.current = new Chart(roleRef.current, {
      type: "doughnut",
      data: {
        labels: roleData.map(r => ROLE_LABELS[r.role] || r.role),
        datasets: [{
          data: roleData.map(r => r.count),
          backgroundColor: roleData.map(r => ROLE_COLORS[r.role] || "#999"),
          borderWidth: 2,
          borderColor: border,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw} คน` } },
        },
      },
    });

    // Cert status chart
    const certData = data.certifications.by_status;
    statusChartRef.current = new Chart(statusRef.current, {
      type: "doughnut",
      data: {
        labels: certData.map(c => STATUS_LABELS[c.status] || c.status),
        datasets: [{
          data: certData.map(c => c.count),
          backgroundColor: certData.map(c => STATUS_COLORS[c.status] || "#999"),
          borderWidth: 2,
          borderColor: border,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw} รายการ` } },
        },
      },
    });

    // Faculty bar chart
    const facData = data.curriculums.by_faculty.slice(0, 8);
    facultyChartRef.current = new Chart(facultyRef.current, {
      type: "bar",
      data: {
        labels: facData.map(f => f.faculty.length > 15 ? f.faculty.slice(0, 15) + "..." : f.faculty),
        datasets: [{
          label: "จำนวนหลักสูตร",
          data: facData.map(f => f.count),
          backgroundColor: "#B5D4F4",
          borderColor: "#378ADD",
          borderWidth: 1.5,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#888", font: { size: 11 } } },
          y: { ticks: { color: "#888", font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
        },
      },
    });

    return () => {
      roleChartRef.current?.destroy();
      statusChartRef.current?.destroy();
      facultyChartRef.current?.destroy();
    };
  }, [data]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/users/dashboard");
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleName) => {
    const map = {
      admin: "bg-purple-100 text-purple-800",
      officer: "bg-green-100 text-green-800",
      teacher: "bg-blue-100 text-blue-800",
    };
    return map[roleName] || "bg-gray-100 text-gray-800";
  };

  const getInitials = (title, firstName, lastName) =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const getAvatarColor = (roleName) => {
    const map = {
      admin: "bg-purple-100 text-purple-700",
      officer: "bg-green-100 text-green-700",
      teacher: "bg-blue-100 text-blue-700",
    };
    return map[roleName] || "bg-gray-100 text-gray-700";
  };

  if (loading) return (
    <MainLayout role="admin">
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout role="admin">
      <div className="mx-auto p-5 space-y-4">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h2>
          <p className="text-sm text-gray-500">ภาพรวมระบบทั้งหมด</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "ผู้ใช้ทั้งหมด",
              value: data?.users.total || 0,
              sub: `Active ${data?.users.active || 0} คน`,
              color: "text-blue-600",
              icon: Users,
              bg: "bg-blue-50"
            },
            {
              label: "ใช้งานอยู่",
              value: data?.users.active || 0,
              sub: `${data?.users.total ? Math.round(data.users.active / data.users.total * 100) : 0}% ของทั้งหมด`,
              color: "text-green-700",
              icon: TrendingUp,
              bg: "bg-green-50"
            },
            {
              label: "หลักสูตรทั้งหมด",
              value: data?.curriculums.total || 0,
              sub: `${data?.curriculums.by_faculty.length || 0} คณะ/สาขา`,
              color: "text-purple-700",
              icon: BookOpen,
              bg: "bg-purple-50"
            },
            {
              label: "กรรมการวิชาการ",
              value: data?.academic_committee.total || 0,
              sub: "ดำรงตำแหน่งอยู่",
              color: "text-amber-600",
              icon: GraduationCap,
              bg: "bg-amber-50"
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
                </div>
                <div className={`${s.bg} p-2 rounded-lg`}>
                  <s.icon size={18} className={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active recently */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              ผู้ใช้ที่ active ใน 7 วันล่าสุด
            </p>
            <p className="text-xs text-gray-400">อัปเดตข้อมูลในช่วง 7 วันที่ผ่านมา</p>
          </div>
          <div className="ml-auto text-2xl font-bold text-blue-600">
            {data?.users.recently_active || 0}
            <span className="text-sm font-normal text-gray-400 ml-1">คน</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-3">

          {/* Role chart */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">สัดส่วนบทบาทผู้ใช้</p>
            <div className="flex gap-3 mb-2 flex-wrap">
              {data?.users.by_role.map(r => (
                <span key={r.role} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ROLE_COLORS[r.role] || "#999" }}></span>
                  {ROLE_LABELS[r.role] || r.role} {r.count}
                </span>
              ))}
            </div>
            <div className="relative h-48"><canvas ref={roleRef} /></div>
          </div>

          {/* Cert status chart */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">สถานะเอกสารรับรองคุณวุฒิ</p>
            <div className="flex gap-3 mb-2 flex-wrap">
              {data?.certifications.by_status.map(c => (
                <span key={c.status} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: STATUS_COLORS[c.status] || "#999" }}></span>
                  {STATUS_LABELS[c.status] || c.status} {c.count}
                </span>
              ))}
            </div>
            <div className="relative h-48"><canvas ref={statusRef} /></div>
          </div>
        </div>

        {/* Faculty bar chart */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">
            จำนวนหลักสูตรแยกตามคณะ (ทั้งหมด {data?.curriculums.total} หลักสูตร)
          </p>
          <div className="relative h-48"><canvas ref={facultyRef} /></div>
        </div>

        {/* Latest Users */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">ผู้ใช้ที่สมัครล่าสุด</p>
          <ul className="space-y-2">
            {data?.users.latest.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${getAvatarColor(u.role_name)}`}>
                  {getInitials(u.title, u.first_name, u.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">
                    {u.title}{u.first_name} {u.last_name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{u.email}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getRoleBadge(u.role_name)}`}>
                    {ROLE_LABELS[u.role_name] || u.role_name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {u.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </MainLayout>
  );
};