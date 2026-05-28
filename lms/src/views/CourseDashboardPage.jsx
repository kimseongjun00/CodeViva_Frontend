import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { getCourses, updateCourse, deleteCourse } from '../api/courses';
import Pagination from '../components/eclass/Pagination';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import Footer from '../components/eclass/Footer';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';

const PAGE_SIZE = 10;
const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

const CourseDashboardPage = () => {
  const { user } = useAuth();
  const { selectedCourse, selectCourse, clearCourse } = useCourse();
  const navigate = useNavigate();

  const isInstructor = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', year: '', semester: 'SPRING' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

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

  const openEdit = (course, e) => {
    e.stopPropagation();
    setEditingCourse(course);
    setEditForm({ name: course.name, year: course.year ?? new Date().getFullYear(), semester: course.semester ?? 'SPRING' });
    setEditError('');
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { setEditError('과목명을 입력해주세요.'); return; }
    setEditSaving(true);
    try {
      const updated = await updateCourse({ id: editingCourse.id, name: editForm.name.trim(), year: Number(editForm.year), semester: editForm.semester });
      setCourses((p) => p.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCourse(null);
    } catch {
      setEditError('수정에 실패했습니다.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteCourse = async (course, e) => {
    e.stopPropagation();
    if (!window.confirm(`"${course.name}" 과목을 삭제하시겠습니까?`)) return;
    try {
      await deleteCourse(course.id);
      setCourses((p) => p.filter((c) => c.id !== course.id));
      if (selectedCourse?.id === course.id) clearCourse();
    } catch {
      alert('삭제에 실패했습니다.');
    }
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
                  <thead className="bg-[#8c8c8c] text-white">
                    <tr className="border-b border-[#d3d3d3] text-xs font-bold">
                      <th className="w-12 py-2.5">번호</th>
                      <th className="px-4 py-2.5 text-left">과목명</th>
                      <th className="w-20 py-2.5">연도</th>
                      <th className="w-24 py-2.5">학기</th>
                      <th className="w-20 py-2.5">입장</th>
                      {isInstructor && <th className="w-24 py-2.5">관리</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e2e2]">
                    {courses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((course, idx) => (
                      <tr
                        key={course.id}
                        className="cursor-pointer hover:bg-[#f0f7f9]"
                        onClick={() => handleEnter(course)}
                      >
                        <td className="py-2.5 text-gray-400">{courses.length - ((currentPage - 1) * PAGE_SIZE + idx)}</td>
                        <td className="px-4 py-2.5 text-left">
                          <span className="font-semibold text-[#1a6d7e]">{course.name}</span>
                          <span className="ml-2 text-[11px] text-gray-400">ID: {course.id}</span>
                        </td>
                        <td className="py-2.5 text-gray-600">{course.year ?? '-'}</td>
                        <td className="py-2.5 text-gray-600">
                          {SEMESTER_KO[course.semester] ?? course.semester ?? '-'}
                        </td>
                        <td className="py-2.5">
                          <span className="rounded-sm bg-[#1a6d7e] px-3 py-1 text-[11px] font-bold text-white">
                            입장
                          </span>
                        </td>
                        {isInstructor && (
                          <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => openEdit(course, e)}
                                className="text-[11px] text-[#1a6d7e] hover:underline"
                              >
                                수정
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={(e) => handleDeleteCourse(course, e)}
                                className="text-[11px] text-red-400 hover:underline"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination currentPage={currentPage} totalPages={Math.ceil(courses.length / PAGE_SIZE)} onPageChange={setCurrentPage} />
                <div className="border-t border-[#e2e2e2] bg-[#f8f8f8] px-4 py-2 text-right text-xs text-gray-400">
                  전체 {courses.length}개
                </div>
              </div>
            )}
          </div>
        </MainLayout>
        <Footer />
      </div>

      {/* 과목 수정 모달 */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] border-[3px] border-[#a58d6f] bg-white px-5 pt-5 pb-4 shadow-lg font-['Dotum','Apple_SD_Gothic_Neo',sans-serif]">
            <h3 className="border-b border-[#d8d8d8] pb-2 text-[18px] font-bold text-[#2d2d2d]">과목 수정</h3>
            <div className="mt-3 space-y-2">
              <div>
                <label className="mb-0.5 block text-[11px] font-bold text-[#555]">과목명</label>
                <input
                  className="h-7 w-full border border-[#d6d6d6] px-2 text-xs focus:border-[#a58d6f] focus:outline-none"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                />
              </div>
              <div className="flex gap-3">
                <div>
                  <label className="mb-0.5 block text-[11px] font-bold text-[#555]">연도</label>
                  <input
                    type="number"
                    className="h-7 w-24 border border-[#d6d6d6] px-2 text-xs focus:border-[#a58d6f] focus:outline-none"
                    value={editForm.year}
                    onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))}
                    min={2020} max={2099}
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[11px] font-bold text-[#555]">학기</label>
                  <select
                    className="h-7 border border-[#d6d6d6] px-2 text-xs focus:border-[#a58d6f] focus:outline-none"
                    value={editForm.semester}
                    onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))}
                  >
                    {Object.entries(SEMESTER_KO).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              {editError && <p className="text-[11px] text-red-500">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingCourse(null)}
                  className="flex-1 h-8 border border-[#d6d6d6] text-[12px] text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex-1 h-8 bg-gradient-to-b from-[#2d5c90] to-[#0c2f59] text-[12px] font-bold text-white disabled:opacity-60"
                >
                  {editSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDashboardPage;
