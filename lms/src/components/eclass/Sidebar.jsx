import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';

const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

const Sidebar = ({ currentPath }) => {
  const { user, logout } = useAuth();
  const { selectedCourse, recentCourses, selectCourse, clearCourse } = useCourse();
  const navigate = useNavigate();
  const [courseOpen, setCourseOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

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
    { label: '수강생 관리', path: '/instructor/manage-students' },
    { label: '팀프로젝트', path: null },
    { label: '시험', path: null },
    { label: '토론', path: null },
    { label: '투표', path: null },
    { label: '설문', path: null },
    { label: '성적', path: null },
    { label: '이의신청', path: null },
  ];

  const HOME_MENUS = [
    { label: '개설 과목', path: '/courses' },
    ...(isInstructor ? [{ label: '과목 개설', path: '/courses/create' }] : []),
    { label: '로그아웃', path: null, action: handleLogout },
  ];

  const isHomePage = !selectedCourse || currentPath === '/courses' || currentPath === '/courses/create';
  const menus = isHomePage ? HOME_MENUS : (isInstructor ? INSTRUCTOR_MENUS : STUDENT_MENUS);

  useEffect(() => {
    const active = {};
    menus.forEach((menu) => {
      if (menu.sub?.some((s) => s.path === currentPath)) {
        active[menu.label] = true;
      }
    });
    if (Object.keys(active).length > 0) {
      setOpenMenus((prev) => ({ ...prev, ...active }));
    }
  }, [currentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMenu = (label, path, hasActiveSub) => {
    if (path) navigate(path);
    setOpenMenus((prev) => ({
      ...prev,
      [label]: hasActiveSub ? true : !prev[label],
    }));
  };

  const semesterLabel = selectedCourse?.year && selectedCourse?.semester
    ? `${selectedCourse.year}-${SEMESTER_KO[selectedCourse.semester] ?? selectedCourse.semester}`
    : null;

  const dropdownCourses = recentCourses.length > 0
    ? recentCourses
    : selectedCourse ? [selectedCourse] : [];

  return (
    <aside className="w-[195px] shrink-0 px-2 pb-2">
      {/* 수강과목 박스 */}
      <div className="-mt-5 mb-2 overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-[#f3f3f3]">
        <div className="border-b border-[#cfcfcf] bg-[#f3f6f7] py-1.5 text-center text-[11px] font-bold text-[#1a6d7e]">
          개설 과목
        </div>
        <div className="p-2">
          {semesterLabel && (
            <div className="mb-1 text-center text-[11px] text-gray-500">{semesterLabel}</div>
          )}

          <button
            onClick={() => setCourseOpen((v) => !v)}
            className="flex w-full items-center justify-between border border-[#bdbdbd] bg-white px-2 py-1 text-left text-[11px] hover:bg-gray-50"
          >
            <span className="truncate font-bold text-[#1a6d7e]">
              {selectedCourse ? selectedCourse.name : '과목 선택'}
            </span>
            <span className="ml-1 shrink-0 text-[8px] text-gray-500">
              {courseOpen ? '▲' : '▼'}
            </span>
          </button>

          {courseOpen && (
            <div className="border border-t-0 border-[#bdbdbd] bg-[#f9f9f9]">
              {dropdownCourses.length === 0 ? (
                <div className="px-2 py-1.5 text-[11px] text-gray-400">등록된 과목 없음</div>
              ) : (
                dropdownCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleSelectCourse(course)}
                    className={`block w-full border-b border-[#eee] px-2 py-1 text-left text-[11px] hover:bg-[#eaf4f6] ${
                      selectedCourse?.id === course.id ? 'bg-[#eaf4f6] font-bold text-[#1a6d7e]' : 'text-[#333]'
                    }`}
                  >
                    {course.name}
                    {course.year && course.semester && (
                      <span className="ml-1 text-[9px] text-gray-400">
                        ({SEMESTER_KO[course.semester] ?? course.semester})
                      </span>
                    )}
                  </button>
                ))
              )}
              <button
                onClick={() => { setCourseOpen(false); handleChangeCourse(); }}
                className="block w-full px-2 py-1 text-left text-[11px] text-[#1a6d7e] hover:bg-gray-50"
              >
                + 과목 변경 / 추가
              </button>
            </div>
          )}

          {selectedCourse && (
            <div className="mb-2 border-b border-gray-200 pb-1.5 text-center text-[9px] text-gray-400">
              ID: {selectedCourse.id}
            </div>
          )}

          <ul className="space-y-[1px] text-[12px]">
            {menus.map((menu) => {
              const isActive = menu.path && currentPath === menu.path;
              const hasActiveSub = menu.sub?.some((s) => s.path === currentPath);
              const isExpanded = !!openMenus[menu.label];

              if (menu.action) {
                return (
                  <li key={menu.label}>
                    <button
                      onClick={menu.action}
                      className="flex w-full items-center px-1.5 py-0.5 text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-1 text-[6px]">▶</span>
                      {menu.label}
                    </button>
                  </li>
                );
              }

              if (!menu.path && !menu.sub) {
                return (
                  <li key={menu.label} className="flex items-center px-1.5 py-0.5 text-gray-400 cursor-default select-none pointer-events-none">
                    <span className="mr-1 text-[6px]">▶</span>
                    {menu.label}
                  </li>
                );
              }

              if (menu.sub) {
                return (
                  <li key={menu.label}>
                    <button
                      onClick={() => toggleMenu(menu.label, menu.path, hasActiveSub)}
                      className={`flex w-full items-center px-1.5 py-0.5 ${
                        isActive || hasActiveSub
                          ? 'bg-[#2b7c8e] font-bold text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-1 text-[6px]">▶</span>
                      <span className="flex-1 text-left">{menu.label}</span>
                      <span className="text-[7px] opacity-70">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <ul className="ml-3 border-l-2 border-[#2b7c8e]/30">
                        {menu.sub.map((sub) => (
                          <li key={sub.path}>
                            <Link
                              to={sub.path}
                              className={`flex items-center px-1.5 py-0.5 ${
                                currentPath === sub.path
                                  ? 'bg-[#d9eaee] font-bold text-[#1a6d7e]'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span className="mr-1 text-[6px] text-gray-400">└</span>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={menu.label}>
                  <Link
                    to={menu.path}
                    className={`flex items-center px-1.5 py-0.5 ${
                      isActive
                        ? 'bg-[#2b7c8e] font-bold text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1 text-[6px]">▶</span>
                    {menu.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 열린게시판 */}
      <div className="overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-white">
        <div className="px-2 py-1.5 text-[12px] text-gray-600">
          <span className="mr-1 text-[6px]">▶</span> 열린게시판
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
