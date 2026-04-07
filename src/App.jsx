import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import CredentialLoginPage from './views/CredentialLoginPage';
import EclassAssignmentListPage from './views/EclassAssignmentListPage';
import {
  InstructorAssignmentCreatePage,
  InstructorAssignmentDetailPage,
  StudentAssignmentSubmitPage,
  StudentAssignmentVerifyPage,
} from './views/AssignmentFlowPages';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/credentials" element={<CredentialLoginPage />} />

      <Route path="/common/assignment-list" element={<Navigate to="/student/assignment-list" replace />} />
      <Route path="/student/assignment-list" element={<EclassAssignmentListPage role="student" />} />
      <Route path="/instructor/assignment-list" element={<EclassAssignmentListPage role="instructor" />} />

      <Route path="/student/assignment-submit" element={<StudentAssignmentSubmitPage />} />
      <Route path="/student/assignment-verify" element={<StudentAssignmentVerifyPage />} />
      <Route path="/instructor/assignment-detail" element={<InstructorAssignmentDetailPage />} />
      <Route path="/instructor/assignment-create" element={<InstructorAssignmentCreatePage />} />

      <Route path="/student/code-submit" element={<Navigate to="/student/assignment-submit" replace />} />
      <Route path="/student/voice-qa" element={<Navigate to="/student/assignment-verify" replace />} />
      <Route path="/instructor/assignment-create/basic" element={<Navigate to="/instructor/assignment-create" replace />} />
      <Route path="/instructor/dashboard/submission" element={<Navigate to="/instructor/assignment-list" replace />} />
      <Route path="/instructor/dashboard/students" element={<Navigate to="/instructor/assignment-list" replace />} />
      <Route path="/instructor/result-overview" element={<Navigate to="/instructor/assignment-list" replace />} />
    </Routes>
  );
};

export default App;
