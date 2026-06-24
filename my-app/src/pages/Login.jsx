import { useState } from "react";
import logo from "../assets/logo_rmu.png";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'


const CREDENTIALS = {
  admin: { password: "admin1234", role: "admin" },
  teacher: { password: "teacher1234", role: "teacher" },
  officer: { password: "officer1234", role: "officer" },
};

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();



  const { setUser } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await api.post('/login', {
        username: username.trim().toLowerCase(),
        password: password.trim()
      })

      const role = res.data.role
      setUser({
        role,
        first_name: res.data.first_name,
        last_name: res.data.last_name
      })

      // //  เก็บ role
      // setUser({ role })

      //  ไป dashboard
      navigate('/dashboard')



    } catch (err) {
      console.log(err.response?.data)
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 text-white">
        <img src={logo} alt="logo" className="w-40 mb-6" />
        <h1 className="text-xl font-semibold text-center leading-relaxed">
          ระบบฐานข้อมูลหลักสูตรสภาวิชาการ
        </h1>
        <p className="text-sm text-gray-200 mt-3 text-center">
          มหาวิทยาลัยราชภัฏมหาสารคาม
        </p>
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-gray-200 rounded-2xl shadow-md p-8">
          <h2 className="text-3xl font-semibold mb-5">เข้าสู่ระบบ</h2>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div className="mb-4">
              <label className="text-sm block mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"   // ✅ เพิ่มอันนี้
                  className="w-full rounded-full pl-10 pr-4 py-2 border"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="text-sm block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"   // ✅ เพิ่มอันนี้
                  className="w-full rounded-full pl-10 pr-10 py-2 border"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-600 mb-4 text-sm">{error}</div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-full text-white transition
    ${loading
                  ? "bg-blue-700 cursor-not-allowed"
                  : "bg-blue-900 hover:bg-blue-800"
                }`}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
            {/* ✅ Register Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                อาจารย์ที่ยังไม่มีบัญชี?{" "}
                <Link
                  to="/register"
                  className="text-blue-700 hover:underline font-medium"
                >
                  สร้างบัญชีที่นี่
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};