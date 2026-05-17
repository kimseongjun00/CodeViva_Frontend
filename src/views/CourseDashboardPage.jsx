import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import Footer from '../components/eclass/Footer';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';

const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

const CourseDashboardPage = () => {
  const { user } = useAuth();
  const { recentCourses, selectCourse } = useCourse();
  const navigate = useNavigate();
  const location = useLocation();

  const isInstructor = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [courseIdInput, setCourseIdInput] = useState('');
  const [courseNameInput, setCourseNameInput] = useState('');

  const handleSelectById = () => {
    const id = parseInt(courseIdInput, 10);
    if (!id) return;
    const course = { id, name: courseNameInput.trim() || `과목 #${id}` };
    selectCourse(course);
    navigate(isInstructor ? '/instructor/assignment-list' : '/student/assignment-list');
  };

  const handleSelectRecent = (course) => {
    selectCourse(course);
    navigate(isInstructor ? '/instructor/assignment-list' : '/student/assignment-list');
  };

  const sidebar = <Sidebar currentPath={location.pathname} />;

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[20px] leading-[28px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-52 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-full max-w-[1330px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={sidebar}>
          <div>
            <div className="mb-5 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[30px] leading-none font-bold text-[#5a5a5a]">수강과목</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">수강과목 선택</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* 교수 – 과목 개설 버튼 */}
              {isInstructor && (
                <div className="flex items-center justify-between rounded border border-[#1a6d7e]/30 bg-teal-50 px-4 py-3">
                  <div className="text-xs text-teal-700">
                    새 과목을 개설하고 수강생을 등록할 수 있습니다.
                  </div>
                  <button
                    onClick={() => navigate('/courses/create')}
                    className="rounded bg-[#1a6d7e] px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800"
                  >
                    + 과목 개설
                  </button>
                </div>
              )}

              {/* 최근 접속 과목 */}
              {recentCourses.length > 0 && (
                <div className="border border-[#d3d3d3] bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-[#5a5a5a]">최근 접속 과목</h3>
                  <div className="space-y-2">
                    {recentCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex cursor-pointer items-center justify-between border border-[#e0e0e0] px-3 py-2 hover:bg-[#f0f7f9]"
                        onClick={() => handleSelectRecent(course)}
                      >
                        <div>
                          <span className="font-bold text-[#1a6d7e]">{course.name}</span>
                          {course.year && course.semester && (
                            <span className="ml-2 text-[11px] text-gray-500">
                              {course.year} {SEMESTER_KO[course.semester] ?? course.semester}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">ID: {course.id}</span>
                          <span className="rounded bg-[#1a6d7e] px-2 py-0.5 text-[10px] text-white">입장</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 과목 ID 직접 입력 */}
              <div className="border border-[#d3d3d3] bg-white p-4">
                <h3 className="mb-3 text-sm font-bold text-[#5a5a5a]">과목 ID로 입장</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="과목 ID"
                    value={courseIdInput}
                    onChange={(e) => setCourseIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectById()}
                    className="w-[110px] border border-gray-300 px-2 py-1.5 text-xs focus:border-[#1a6d7e] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="과목명 (선택사항)"
                    value={courseNameInput}
                    onChange={(e) => setCourseNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectById()}
                    className="flex-1 border border-gray-300 px-2 py-1.5 text-xs focus:border-[#1a6d7e] focus:outline-none"
                  />
                  <button
                    onClick={handleSelectById}
                    disabled={!courseIdInput}
                    className="bg-[#4d4d4d] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    입장
                  </button>
                </div>
              </div>

              {/* 안내 */}
              {recentCourses.length === 0 && !isInstructor && (
                <div className="border border-[#d3d3d3] bg-[#fafafa] p-5 text-center text-xs text-gray-500">
                  교수님께 과목 ID를 받아 위 입력창에 입력하시면 과목에 입장할 수 있습니다.
                </div>
              )}
            </div>
          </div>
        </MainLayout>
        <Footer />
      </div>
    </div>
  );
};

export default CourseDashboardPage;
