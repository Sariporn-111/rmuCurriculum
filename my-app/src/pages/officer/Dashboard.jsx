import { MainLayout } from "../../components/MainLayout";
import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { BookOpen, Send, Users, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

Chart.register(...registerables);

export const OfficerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const yearRef = useRef(null);
  const yearChartRef = useRef(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!data) return;

    yearChartRef.current = new Chart(yearRef.current, {
      type: "bar",
      data: {
        labels: data.curriculum_by_year.map(
          (y) => `ปี ${y.year}`
        ),
        datasets: [
          {
            label: "จำนวนหลักสูตร",
            data: data.curriculum_by_year.map(
              (y) => y.count
            ),
            backgroundColor: "#B5D4F4",
            borderColor: "#378ADD",
            borderWidth: 1.5,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#888",
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#888",
              font: {
                size: 11,
              },
              stepSize: 1,
            },
          },
        },
      },
    });

    return () => {
      yearChartRef.current?.destroy();
    };
  }, [data]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/officer/dashboard");
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout role="officer">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout role="officer">
      <div className="p-3">
        <div className="space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ภาพรวมระบบบริหารจัดการหลักสูตร
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "หลักสูตรทั้งหมด",
                value: data?.stats.total_curriculums || 0,
                icon: BookOpen,
                color: "text-blue-600",
                bg: "bg-blue-50",
                sub: `${data?.curriculum_by_faculty.length || 0} คณะ/สาขา`,
              },
              {
                title: "สมอ.08",
                value: data?.stats.total_smo08 || 0,
                icon: Send,
                color: "text-purple-700",
                bg: "bg-purple-50",
                sub: "เอกสารทั้งหมด",
              },
              {
                title: "กรรมการหลักสูตร",
                value: data?.stats.total_committee || 0,
                icon: Users,
                color: "text-amber-600",
                bg: "bg-amber-50",
                sub: "รายการทั้งหมด",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      {item.title}
                    </p>

                    <h2
                      className={`mt-1 text-3xl font-semibold ${item.color}`}
                    >
                      {item.value}
                    </h2>

                    <p className="mt-1 text-xs text-gray-400">
                      {item.sub}
                    </p>
                  </div>

                  <div className={`${item.bg} rounded-xl p-3`}>
                    <item.icon
                      size={22}
                      className={item.color}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-5">

            {/* Bar Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">
                จำนวนหลักสูตรรายปี
              </h3>

              <p className="mb-4 text-xs text-gray-400">
                เปรียบเทียบจำนวนหลักสูตรในแต่ละปี
              </p>

              <div className="h-56">
                <canvas ref={yearRef} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

            {/* Latest Curriculum */}
            <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    หลักสูตรล่าสุด
                  </h3>

                  <p className="text-xs text-gray-400">
                    รายการหลักสูตรที่เพิ่งเพิ่มล่าสุด
                  </p>
                </div>

                <button
                  onClick={() => navigate("/officer/courses")}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  ดูทั้งหมด
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">
                        ชื่อหลักสูตร
                      </th>

                      <th className="px-5 py-3 font-medium">
                        คณะ
                      </th>

                      <th className="px-5 py-3 font-medium">
                        ปี
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data?.latest_curriculums.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-6 text-center text-gray-400"
                        >
                          ไม่มีข้อมูล
                        </td>
                      </tr>
                    ) : (
                      data?.latest_curriculums.map((c) => (
                        <tr
                          key={c.curriculum_id}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 font-medium text-gray-800">
                            {c.curriculum_name_th}
                          </td>

                          <td className="px-5 py-4 text-xs text-gray-600">
                            {c.faculty}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {c.curriculum_year}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side */}
            <div className="space-y-5">

              {/* Quick Menu */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  เมนูลัด
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      label: "เพิ่มหลักสูตรใหม่",
                      path: "/officer/courses",
                      primary: true,
                    },
                    {
                      label: "อัปโหลด สมอ.08",
                      path: "/officer/revise",
                      primary: false,
                    },
                    {
                      label: "จัดการกรรมการ",
                      path: "/officer/course-committee",
                      primary: false,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${item.primary
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faculty Stats */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  หลักสูตรแยกตามคณะ
                </h3>

                <div className="space-y-2">
                  {data?.curriculum_by_faculty
                    .slice(0, 5)
                    .map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <p className="mr-2 flex-1 truncate text-xs text-gray-600">
                          {f.faculty}
                        </p>

                        <span className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          {f.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};