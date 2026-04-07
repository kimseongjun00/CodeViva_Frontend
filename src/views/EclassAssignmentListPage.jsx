import React, { useEffect, useState } from 'react';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import AssignmentTable from '../components/eclass/AssignmentTable';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';

const EclassAssignmentListPage = ({ role }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [bellCount, setBellCount] = useState(0);
  const currentPath = role === 'instructor' ? '/instructor/assignment-list' : '/student/assignment-list';

  useEffect(() => {
    const fetchHeaderCounts = async () => {
      const getMessages = new Promise((resolve) => {
        setTimeout(() => resolve(4), 180);
      });
      const getNotices = new Promise((resolve) => {
        setTimeout(() => resolve({ check: 4, bell: 6 }), 250);
      });
      const [messages, notices] = await Promise.all([getMessages, getNotices]);
      setMessageCount(messages);
      setCheckCount(notices.check);
      setBellCount(notices.bell);
    };

    fetchHeaderCounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-36 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-[980px] pt-7">
        <Header messageCount={messageCount} checkCount={checkCount} bellCount={bellCount} />
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
