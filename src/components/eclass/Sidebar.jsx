import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';

const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

const Sidebar = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const { selectedCourse, recentCourses, selectCourse, clearCourse } = useCourse();
  const navigate = useNavigate();
  const [courseOpen, setCourseOpen] = useState(false);

  const isInstructor = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeCourse = () => {
    clearCourse();
    navigate('/courses');
  };

  const handleSelectCourse = (course) => {
    selectCourse(course);
    setCourseOpen(false);
    navigate(isInstructor ? '/instructor/assignment-list' : '/student/assignment-list');
  };

  // 공통 메뉴 (eclass 항목 일치)
  const STUDENT_MENUS = [
    { label: '강의계획서', path: null },
    { label: '온라인강의', path: null },
    { label: '공지사항', path: null },
    { label: '질의응답', path: null },
    { label: '강의자료', path: null },
    { label: '출석', path: null },
    { label: '과제', path: '/student/assignment-list' },
    { label: '팀프로젝트', path: null },
    { label: '시험', path: null },
    { label: '토론', path: null },
    { label: '투표', path: null },
    { label: '설문', path: null },
    { label: '성적', path: null },
    { label: '이의신청', path: null },
  ];

  const INSTRUCTOR_MENUS = [
    { label: '강의계획서', path: null },
    { label: '온라인강의', path: null },
    { label: '공지사항', path: null },
    { label: '질의응답', path: null },
    { label: '강의자료', path: null },
    { label: '출석', path: null },
    { label: '과제', path: '/instructor/assignment-list', sub: [
      { label: '과제 출제', path: '/instructor/assignment-create' },
    ]},
    { label: '수강생 추가', path: '/instructor/manage-students' },
    { label: '팀프로젝트', path: null },
    { label: '시험', path: null },
    { label: '토론', path: null },
    { label: '투표', path: null },
    { label: '설문', path: null },
    { label: '성적', path: null },
    { label: '이의신청', path: null },
  ];

  // 홈(과목선택) 화면 메뉴
  const HOME_MENUS = [
    { label: '수강과목', path: '/courses' },
    ...(isInstructor ? [{ label: '과목 개설', path: '/courses/create' }] : []),
    { label: '로그아웃', path: null, action: handleLogout },
  ];

  const isHomePage = !selectedCourse || currentPath === '/courses' || currentPath === '/courses/create';
  const menus = isHomePage ? HOME_MENUS : (isInstructor ? INSTRUCTOR_MENUS : STUDENT_MENUS);

  const semesterLabel = selectedCourse?.year && selectedCourse?.semester
    ? `${selectedCourse.year}-${SEMESTER_KO[selectedCourse.semester] ?? selectedCourse.semester}`
    : null;

  // 드롭다운에 표시할 과목 목록 (현재 선택 과목 포함)
  const dropdownCourses = recentCourses.length > 0
    ? recentCourses
    : selectedCourse ? [selectedCourse] : [];

  return (
    <aside className="w-[240px] shrink-0 px-3 pb-3">
      {/* 수강과목 박스 */}
      <div className="-mt-5 mb-3 overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-white">
        <div className="border-b border-[#cfcfcf] bg-[#f3f6f7] py-2 text-center text-sm font-bold text-[#1a6d7e]">
          수강과목
        </div>
        <div className="p-3">
          {/* 학기 */}
          {semesterLabel && (
            <div className="mb-1 text-center text-[16px] text-gray-500">{semesterLabel}</div>
          )}

          {/* 과목 이름 - 아코디언 */}
          <button
            onClick={() => setCourseOpen((v) => !v)}
            className="flex w-full items-center justify-between border border-[#bdbdbd] bg-white px-2 py-1.5 text-left text-[16px] hover:bg-gray-50"
          >
            <span className="truncate font-bold text-[#1a6d7e]">
              {selectedCourse ? selectedCourse.name : '과목 선택'}
            </span>
            <span className="ml-1 shrink-0 text-[9px] text-gray-500">
              {courseOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* 아코디언 펼침 - 아래로 늘어남 */}
          {courseOpen && (
            <div className="border border-t-0 border-[#bdbdbd] bg-[#f9f9f9]">
              {dropdownCourses.length === 0 ? (
                <div className="px-3 py-2 text-[16px] text-gray-400">등록된 과목 없음</div>
              ) : (
                dropdownCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`block w-full border-b border-[#eee] px-3 py-1.5 text-left text-[16px] hover:bg-[#eaf4f6] ${
                      selectedCourse?.id === course.id ? 'bg-[#eaf4f6] font-bold text-[#1a6d7e]' : 'text-[#333]'
                    }`}
                  >
                    {course.name}
                    {course.year && course.semester && (
                      <span className="ml-1 text-[10px] text-gray-400">
                        ({SEMESTER_KO[course.semester] ?? course.semester})
                      </span>
                    )}
                  </button>
                ))
              )}
              <button
                onClick={() => { setCourseOpen(false); handleChangeCourse(); }}
                className="block w-full px-3 py-1.5 text-left text-[16px] text-[#1a6d7e] hover:bg-gray-50"
              >
                + 과목 변경 / 추가
              </button>
            </div>
          )}

          {/* 과목 ID */}
          {selectedCourse && (
            <div className="mb-3 border-b border-gray-200 pb-2 text-center text-[10px] text-gray-400">
              ID: {selectedCourse.id}
            </div>
          )}

          {/* 메뉴 리스트 */}
          <ul className="space-y-[1px] text-[16px]">
            {menus.map((menu) => {
              const isActive = menu.path && currentPath === menu.path;
              const hasActiveSub = menu.sub?.some((s) => s.path === currentPath);

              // 액션 버튼 (로그아웃 등)
              if (menu.action) {
                return (
                  <li key={menu.label}>
                    <button
                      onClick={menu.action}
                      className="flex w-full items-center px-2 py-1 text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-1.5 text-[7px]">▶</span>
                      {menu.label}
                    </button>
                  </li>
                );
              }

              // 비활성 항목
              if (!menu.path) {
                return (
                  <li key={menu.label} className="flex items-center px-2 py-1 text-gray-400 cursor-default select-none pointer-events-none">
                    <span className="mr-1.5 text-[7px]">▶</span>
                    {menu.label}
                  </li>
                );
              }

              return (
                <li key={menu.label}>
                  <Link
                    to={menu.path}
                    className={`flex items-center px-2 py-1 ${
                      isActive || hasActiveSub
                        ? 'bg-[#2b7c8e] font-bold text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1.5 text-[7px]">▶</span>
                    {menu.label}
                  </Link>
                  {/* 서브메뉴 */}
                  {menu.sub && (
                    <ul className="border-l-2 border-[#2b7c8e]/30 ml-4">
                      {menu.sub.map((sub) => (
                        <li key={sub.path}>
                          <Link
                            to={sub.path}
                            className={`flex items-center px-2 py-1 ${
                              currentPath === sub.path
                                ? 'bg-[#d9eaee] font-bold text-[#1a6d7e]'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-1.5 text-[7px] text-gray-400">-</span>
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 열린게시판 */}
      <div className="overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-white">
        <div className="px-3 py-2 text-[16px] text-gray-600">
          <span className="mr-1.5 text-[7px]">▶</span> 열린게시판
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
