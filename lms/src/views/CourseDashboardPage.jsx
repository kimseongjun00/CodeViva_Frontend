import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { getCourses } from '../api/courses';
import Pagination from '../components/eclass/Pagination';

const PAGE_SIZE = 10;
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import Footer from '../components/eclass/Footer';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';

const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

const CourseDashboardPage = () => {
  const { user } = useAuth();
  const { selectCourse } = useCourse();
  const navigate = useNavigate();

  const isInstructor = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(() => setError('과목 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const handleEnter = (course) => {
    selectCourse({ id: course.id, name: course.name, year: course.year, semester: course.semester });
    navigate(isInstructor ? '/instructor/assignment-list' : '/student/assignment-list');
  };

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath="/courses" />}>
          <div>
            <div className="mb-5 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[30px] leading-none font-bold text-[#5a5a5a]">개설 과목</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">개설 과목</span>
              </div>
            </div>

            {isInstructor && (
              <div className="mb-4 flex items-center justify-between rounded border border-[#1a6d7e]/30 bg-teal-50 px-4 py-3">
                <span className="text-xs text-teal-700">새 과목을 개설하고 수강생을 등록할 수 있습니다.</span>
                <button
                  onClick={() => navigate('/courses/create')}
                  className="rounded-sm bg-[#1a6d7e] px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800"
                >
                  + 과목 개설
                </button>
              </div>
            )}

            {loading ? (
              <div className="border border-[#d3d3d3] bg-white py-12 text-center text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : error ? (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            ) : courses.length === 0 ? (
              <div className="rounded border-2 border-dashed border-[#d3d3d3] bg-white py-16 text-center">
                <p className="text-sm text-gray-500">
                  {isInstructor ? '개설된 과목이 없습니다. 과목을 개설해주세요.' : '수강 중인 과목이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="border border-[#d3d3d3] bg-white">
                <table className="w-full border-t-2 border-[#7f7f7f] text-center text-[13px]">
                  <thead className="bg-[#cccccc]">
                    <tr className="border-b border-[#d3d3d3] text-xs font-bold text-gray-600">
                      <th className="w-12 py-2.5">번호</th>
                      <th className="px-4 py-2.5 text-left">과목명</th>
                      <th className="w-20 py-2.5">연도</th>
                      <th className="w-24 py-2.5">학기</th>
                      <th className="w-20 py-2.5">입장</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2e2]">
                    {courses.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE).map((course, idx) => {
                      <tr
                        key={course.id}
                        className="cursor-pointer hover:bg-[#f0f7f9]"
                        onClick={() => handleEnter(course)}
                      >
                        <td className="py-3 text-gray-400">{courses.length - ((currentPage-1)*PAGE_SIZE + idx)}</td>
                        <td className="px-4 py-3 text-left">
                          <span className="font-semibold text-[#1a6d7e]">{course.name}</span>
                          <span className="ml-2 text-[11px] text-gray-400">ID: {course.id}</span>
                        </td>
                        <td className="py-3 text-gray-600">{course.year ?? '-'}</td>
                        <td className="py-3 text-gray-600">
                          {SEMESTER_KO[course.semester] ?? course.semester ?? '-'}
                        </td>
                        <td className="py-3">
                          <span className="rounded-sm bg-[#1a6d7e] px-3 py-1 text-[11px] font-bold text-white">
                            입장
                          </span>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </table>
                <Pagination currentPage={currentPage} totalPages={Math.ceil(courses.length/PAGE_SIZE)} onPageChange={setCurrentPage} />
                <div className="border-t border-[#e2e2e2] bg-[#f8f8f8] px-4 py-2 text-right text-xs text-gray-400">
                  전체 {courses.length}개
                </div>
              </div>
            )}
          </div>
        </MainLayout>
        <Footer />
      </div>
    </div>
  );
};

export default CourseDashboardPage;
