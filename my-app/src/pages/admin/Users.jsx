import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "../../components/MainLayout";
import { UserModal } from "../../components/admin/UserModal";
import api from "../../services/api";
import Swal from "sweetalert2";
import {
  Search, Plus, Pencil, Ban, Trash2, ChevronDown, KeyRound,
  Users as UsersIcon, CheckCircle2, XCircle, Shield,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const emptyForm = {
  prefix: "", firstName: "", lastName: "", email: "", phone: "",
  username: "", password: "", role_id: "", status: "active",
  faculty_id: "",      // ← เพิ่ม
  department_id: "",   // ← เพิ่ม
};

const PAGE_SIZE = 10;

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { user: currentUser } = useAuth();
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  // reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.map(u => ({
        ...u,
        id: u.id || u.user_id,
        status: cleanStatus(u.status),
      })));
    } catch (err) {
      console.error("fetchUsers error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const res = await api.get("/roles");
    setRoles(res.data);
  };

  const statusLabel = (s) => s === "active" ? "ใช้งาน" : s === "inactive" ? "ระงับ" : s;
  const cleanStatus = (s) => s?.toString().trim().toLowerCase();

  const openAddModal = () => {
    setIsEdit(false); setSelectedId(null);
    setForm({ ...emptyForm }); setShowModal(true);
  };

  // แก้เฉพาะฟังก์ชัน openEditModal ใน Users.jsx
  const openEditModal = (u) => {
    setIsEdit(true);
    setSelectedId(u.id);
    setForm({
      prefix: u.title || "",
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      email: u.email || "",
      username: u.username || "",
      password: "",
      role_id: u.role_id || "",
      status: u.status || "active",
      phone: u.phone || "",   // ← เพิ่ม
      faculty_id: u.faculty_id || "",   // ← เพิ่ม
      department_id: u.department_id || "",   // ← เพิ่ม
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setForm({ ...emptyForm }); };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrors({});

      const payload = {
        title: form.prefix,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone || null,
        status: form.status,
        role_id: Number(form.role_id),
        username: form.username,
        teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
        department_id: form.department_id ? Number(form.department_id) : null,  // ← เพิ่ม
      };

      if (isEdit) {
        await api.put(`/users/${selectedId}`, payload);
      } else {
        payload.password = form.password;
        await api.post("/users", payload);
      }

      await fetchUsers();
      closeModal();

      Swal.fire({
        toast: true, position: "top-end", icon: "success",
        title: "บันทึกสำเร็จ", showConfirmButton: false, timer: 2000,
      });
    } catch (err) {
      const message = err.response?.data?.error || "";
      if (message.includes("อีเมล"))
        setErrors((prev) => ({ ...prev, email: "อีเมลนี้ถูกใช้แล้ว" }));
      if (message.includes("ชื่อผู้ใช้"))
        setErrors((prev) => ({ ...prev, username: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ", text: "คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#2563eb", cancelButtonColor: "#d1d5db",
      confirmButtonText: "ลบ", cancelButtonText: "ยกเลิก", reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "ลบสำเร็จ", showConfirmButton: false, timer: 2000 });
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถลบได้", "error");
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === "active" ? "inactive" : "active";
    const result = await Swal.fire({
      title: "ยืนยันการเปลี่ยนสถานะ",
      text: `คุณต้องการ${newStatus === "active" ? "ใช้งาน" : "ระงับ"}ผู้ใช้งานนี้ใช่หรือไม่?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#2563eb", cancelButtonColor: "#d1d5db",
      confirmButtonText: "ยืนยัน", cancelButtonText: "ยกเลิก", reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      await api.put(`/users/${u.id}`, {
        username: u.username, title: u.title,
        first_name: u.first_name, last_name: u.last_name,
        email: u.email, phone: u.phone || null,
        status: newStatus, role_id: u.role_id,
        department_id: u.department_id || null,
      });
      await fetchUsers();
      Swal.fire({
        toast: true, position: "top-end", icon: "success",
        title: `เปลี่ยนเป็น "${newStatus === "active" ? "ใช้งาน" : "ระงับ"}" แล้ว`,
        showConfirmButton: false, timer: 2000,
      });
    } catch {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: "ไม่สามารถเปลี่ยนสถานะได้" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (u) => {
    const result = await Swal.fire({
      title: "รีเซ็ตรหัสผ่าน",
      html: `
        <p>ต้องการรีเซ็ตรหัสผ่านของ</p>
        <b>${u.first_name} ${u.last_name}</b>
        <br/><br/>
        <p>รหัสผ่านใหม่จะเป็น:</p>
        <b style="color:#2563eb">RMU@1234</b>
      `,
      icon: "question", showCancelButton: true,
      confirmButtonText: "รีเซ็ต", cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb", reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/users/${u.id}/reset-password`);
      Swal.fire({
        icon: "success", title: "รีเซ็ตรหัสผ่านสำเร็จ",
        html: `<p>รหัสผ่านใหม่คือ</p><b style="color:#2563eb">RMU@1234</b>`,
      });
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถรีเซ็ตรหัสผ่านได้", "error");
    }
  };

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    inactive: users.filter(u => u.status === "inactive").length,
    admins: users.filter(u => u.role_name === "ผู้ดูแลระบบ" || u.role_name === "admin").length,
  }), [users]);

  const uniqueRoles = useMemo(() => [...new Set(users.map(u => u.role_name))], [users]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach(u => { counts[u.role_name] = (counts[u.role_name] || 0) + 1; });
    return counts;
  }, [users]);

  // ── Filtered + paginated ───────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`;
      const matchSearch =
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ทั้งหมด" || u.status === statusFilter;
      const matchRole = roleFilter === "ทั้งหมด" || u.role_name === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // page numbers to show (max 5 pills)
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, safePage - delta);
      i <= Math.min(totalPages, safePage + delta);
      i++
    ) range.push(i);
    return range;
  }, [safePage, totalPages]);

  // ── Badge maps ─────────────────────────────────────────
  const roleBadge = {
    "ผู้ดูแลระบบ": "bg-rose-100 text-rose-600",
    admin: "bg-rose-100 text-rose-600",
    "อาจารย์": "bg-emerald-100 text-emerald-700",
    "เจ้าหน้าที่": "bg-sky-100 text-sky-700",
  };

  const statusBadge = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-rose-100 text-rose-600",
  };

  // ── Stat card config ───────────────────────────────────
  const statCards = [
    {
      label: "ผู้ใช้งานทั้งหมด",
      value: stats.total,
      icon: <UsersIcon size={18} />,
      iconCls: "bg-blue-50 text-blue-600",
      sub: `เดือน${new Date().toLocaleDateString("th-TH", { month: "long" })}`,
    },
    {
      label: "ใช้งานอยู่",
      value: stats.active,
      icon: <CheckCircle2 size={18} />,
      iconCls: "bg-emerald-50 text-emerald-600",
      sub: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% ของทั้งหมด`,
    },
    {
      label: "ระงับการใช้งาน",
      value: stats.inactive,
      icon: <XCircle size={18} />,
      iconCls: "bg-rose-50 text-rose-500",
      sub: `${stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0}% ของทั้งหมด`,
    },
    {
      label: "ผู้ดูแลระบบ",
      value: stats.admins,
      icon: <Shield size={18} />,
      iconCls: "bg-violet-50 text-violet-600",
      sub: "Admin",
    },
  ];

  return (
    <MainLayout role="admin">
      {/* ── full-width wrapper, padding ทั้งสองข้าง ── */}
      <div className="min-h-screen bg-slate-50/60 px-4 py-6 sm:px-6 xl:px-10">

        {/* Breadcrumb */}
        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          <span>ระบบจัดการ</span>
          <span>/</span>
          <span className="font-medium text-slate-600">ผู้ใช้งาน</span>
        </div>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">จัดการผู้ใช้งาน</h1>
              <p className="text-xs text-slate-500">
                ทั้งหมด {users.length} คน · อัปเดตล่าสุด{" "}
                {new Date().toLocaleDateString("th-TH", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} /> เพิ่มผู้ใช้งาน
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${s.iconCls}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-2xl font-bold leading-tight text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Role filter chips */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Role:</span>
          {["ทั้งหมด", ...uniqueRoles].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${roleFilter === r
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
            >
              {r}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${roleFilter === r ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                }`}>
                {r === "ทั้งหมด" ? users.length : (roleCounts[r] || 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อ / อีเมล"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="relative lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ระงับ</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">ลำดับ</th>
                  <th className="px-6 py-4">ชื่อผู้ใช้</th>
                  <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-4">อีเมล</th>
                  <th className="px-6 py-4">บทบาท</th>
                  <th className="px-6 py-4">หน่วยงาน</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading && users.length === 0 &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-slate-100">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-3 w-full max-w-[140px] animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                }

                {pagedUsers.map((u, index) => (
                  <tr key={u.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="px-6 py-4 text-slate-500">
                      {(safePage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.username}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {u.title}{u.first_name} {u.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${roleBadge[u.role_name] ?? "bg-slate-100 text-slate-600"}`}>
                        {u.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.department || u.faculty || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusBadge[u.status] || "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="แก้ไข"
                        ><Pencil size={16} /></button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.id}
                          className={`rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 ${u.id === currentUser?.id && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-400"}`}
                          title="เปลี่ยนสถานะ"
                        ><Ban size={16} /></button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          title="รีเซ็ตรหัสผ่าน"
                        ><KeyRound size={16} /></button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="ลบ"
                        ><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-slate-400">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <UsersIcon size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-500">ไม่พบข้อมูลผู้ใช้งาน</p>
                        <p className="text-xs">ลองเปลี่ยนคำค้นหาหรือฟิลเตอร์ดูนะ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer + Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3 sm:flex-row">
              {/* info */}
              <span className="text-xs text-slate-500">
                แสดง {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredUsers.length)} จาก {filteredUsers.length} รายการ
              </span>

              {/* pagination controls */}
              <div className="flex items-center gap-1">
                {/* prev */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* first page + ellipsis */}
                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500 transition hover:bg-slate-100"
                    >1</button>
                    {pageNumbers[0] > 2 && (
                      <span className="px-1 text-xs text-slate-400">…</span>
                    )}
                  </>
                )}

                {/* page pills */}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition ${n === safePage
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                      }`}
                  >{n}</button>
                ))}

                {/* last page + ellipsis */}
                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-xs text-slate-400">…</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-500 transition hover:bg-slate-100"
                    >{totalPages}</button>
                  </>
                )}

                {/* next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      <UserModal
        key={showModal ? (isEdit ? `edit-${selectedId}` : "add") : "hidden"}
        show={showModal} isEdit={isEdit} form={form}
        setForm={setForm}
        onClose={closeModal} onSubmit={handleSubmit} roles={roles} loading={loading} errors={errors}
        setErrors={setErrors}
      />
    </MainLayout>
  );
};
