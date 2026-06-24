import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";

// Admin
import { AdminDashboard } from "../pages/admin/Dashboard";
import { Users } from "../pages/admin/Users";

// Officer
import { OfficerDashboard } from "../pages/officer/Dashboard";
import OfficerCourses from "../pages/officer/Courses";
import AcademicCommittee from "../pages/officer/AcademicCommittee";
import CourseCommittee from "../pages/officer/CourseCommittee";
import Revise from "../pages/officer/Revise";
import Certification from "../pages/officer/Certification";
import Report from "../pages/officer/Report";

// Teacher
import { TeacherDashboard } from "../pages/teacher/Dashboard";
import { Smo08 } from "../pages/teacher/Smo08";
import { TeacherCertification } from "../pages/teacher/TeacherCertification";
import { Status } from "../pages/teacher/Status";

import { useAuth } from "../hooks/useAuth";

import { Profile } from "../pages/Profile";
import Register from "../pages/Register";
import TeacherProfile from "../pages/teacher/TeacherProfile";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const OfficerRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== "officer") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const TeacherRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role !== "teacher") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (user?.role === "admin") return <AdminDashboard />;
  if (user?.role === "teacher") return <TeacherDashboard />;
  if (user?.role === "officer") return <OfficerDashboard />;

  return <Navigate to="/" replace />;
};

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gray-100">
      <h1 className="text-6xl font-bold text-blue-900">404</h1>
      <p className="mt-3 text-gray-500">
        ไม่พบหน้าที่คุณต้องการ
      </p>
    </div>
  );
};

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Users />
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route path="/profile" element={<Profile />} />

      {/* Officer */}
      <Route
        path="/officer/courses"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <OfficerCourses />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/academic-committee"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <AcademicCommittee />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/course-committee"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <CourseCommittee />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/revise"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <Revise />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/certification"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <Certification />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/officer/report"
        element={
          <ProtectedRoute>
            <OfficerRoute>
              <Report />
            </OfficerRoute>
          </ProtectedRoute>
        }
      />

      {/* Teacher */}
      <Route
        path="/teacher/smo08"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <Smo08 />
            </TeacherRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/teachercertification"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <TeacherCertification />
            </TeacherRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/status"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <Status />
            </TeacherRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute>
            <TeacherRoute>
              <TeacherProfile />
            </TeacherRoute>
          </ProtectedRoute>
        }
      />
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);