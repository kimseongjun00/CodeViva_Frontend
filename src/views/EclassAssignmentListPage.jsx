import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import AssignmentTable from '../components/eclass/AssignmentTable';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';

const EclassAssignmentListPage = ({ role }) => {
  const { selectedCourse } = useCourse();
  const { loading } = useAuth();
  const navigate = useNavigate();

  const currentPath =
    role === 'instructor' ? '/instructor/assignment-list' : '/student/assignment-list';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[20px] leading-[28px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-52 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-full max-w-[1330px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath={currentPath} />}>
          <AssignmentTable role={role} />
        </MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );
};

export default EclassAssignmentListPage;
