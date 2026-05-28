import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCourse } from './context/CourseContext';
import LoginPage from './views/LoginPage';
import CredentialLoginPage from './views/CredentialLoginPage';
import RegisterPage from './views/RegisterPage';
import CourseDashboardPage from './views/CourseDashboardPage';
import CourseCreatePage from './views/CourseCreatePage';
import CourseStudentManagePage from './views/CourseStudentManagePage';
import EclassAssignmentListPage from './views/EclassAssignmentListPage';
import {
  InstructorAssignmentCreatePage,
  InstructorAssignmentDetailPage,
  StudentAssignmentSubmitPage,
  StudentAssignmentVerifyPage,
} from './views/AssignmentFlowPages';
import { AnnouncementListPage, AnnouncementDetailPage } from './views/AnnouncementPages';
import SubmitPage from './views/mvp/SubmitPage';
import AdminDashboardPage from './views/mvp/AdminDashboardPage';

/* 로그인 필요 라우트 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/* 과목 선택 필요 라우트 */
const CourseRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { selectedCourse } = useCourse();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!selectedCourse) return <Navigate to="/courses" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* 공개 */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/credentials" element={<CredentialLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 과목 선택 */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <CourseDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 과목 개설 */}
      <Route
        path="/courses/create"
        element={
          <ProtectedRoute>
            <CourseCreatePage />
          </ProtectedRoute>
        }
      />

      {/* 학생 과제 목록 */}
      <Route
        path="/student/assignment-list"
        element={
          <ProtectedRoute>
            <EclassAssignmentListPage role="student" />
          </ProtectedRoute>
        }
      />

      {/* 강사 과제 목록 */}
      <Route
        path="/instructor/assignment-list"
        element={
          <ProtectedRoute>
            <EclassAssignmentListPage role="instructor" />
          </ProtectedRoute>
        }
      />

      {/* 학생 과제 제출 */}
      <Route
        path="/student/assignment-submit"
        element={
          <ProtectedRoute>
            <StudentAssignmentSubmitPage />
          </ProtectedRoute>
        }
      />

      {/* 학생 AI 검증 인터뷰 */}
      <Route
        path="/student/assignment-verify"
        element={
          <ProtectedRoute>
            <StudentAssignmentVerifyPage />
          </ProtectedRoute>
        }
      />

      {/* 강사 과제 상세 */}
      <Route
        path="/instructor/assignment-detail"
        element={
          <ProtectedRoute>
            <InstructorAssignmentDetailPage />
          </ProtectedRoute>
        }
      />

      {/* 강사 과제 출제 */}
      <Route
        path="/instructor/assignment-create"
        element={
          <ProtectedRoute>
            <InstructorAssignmentCreatePage />
          </ProtectedRoute>
        }
      />

      {/* 강사 수강생 관리 */}
      <Route
        path="/instructor/manage-students"
        element={
          <ProtectedRoute>
            <CourseStudentManagePage />
          </ProtectedRoute>
        }
      />

      {/* 공지사항 */}
      <Route
        path="/instructor/announcements"
        element={<ProtectedRoute><AnnouncementListPage role="instructor" /></ProtectedRoute>}
      />
      <Route
        path="/instructor/announcement-detail"
        element={<ProtectedRoute><AnnouncementDetailPage role="instructor" /></ProtectedRoute>}
      />
      <Route
        path="/student/announcements"
        element={<ProtectedRoute><AnnouncementListPage role="student" /></ProtectedRoute>}
      />
      <Route
        path="/student/announcement-detail"
        element={<ProtectedRoute><AnnouncementDetailPage role="student" /></ProtectedRoute>}
      />

      {/* 구 URL 호환 리다이렉트 */}
      <Route path="/common/assignment-list" element={<Navigate to="/student/assignment-list" replace />} />
      <Route path="/student/code-submit" element={<Navigate to="/student/assignment-submit" replace />} />
      <Route path="/student/voice-qa" element={<Navigate to="/student/assignment-verify" replace />} />
      <Route path="/instructor/assignment-create/basic" element={<Navigate to="/instructor/assignment-create" replace />} />
      <Route path="/instructor/dashboard/submission" element={<Navigate to="/instructor/assignment-list" replace />} />
      <Route path="/instructor/dashboard/students" element={<Navigate to="/instructor/assignment-list" replace />} />
      <Route path="/instructor/result-overview" element={<Navigate to="/instructor/assignment-list" replace />} />

      {/* 테스트 전용 (인증 없이 접근) */}
      <Route path="/test/verify" element={<StudentAssignmentVerifyPage />} />

      {/* MVP — 별도 서비스 (인증 없음) */}
      <Route path="/submit" element={<SubmitPage />} />
      <Route path="/submit/verify" element={<StudentAssignmentVerifyPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
