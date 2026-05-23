import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { getAllUsers } from '../api/auth';
import { createCourseUser } from '../api/courseUsers';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import Footer from '../components/eclass/Footer';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';

const ROLE_KO = { STUDENT: '학생', TEACHER: '교수', ADMIN: '관리자', TA: '조교' };

const CourseStudentManagePage = () => {
  const { user } = useAuth();
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { success: n, fail: n }

  useEffect(() => {
    getAllUsers()
      .then((data) => {
        // 본인 제외, 학생만
        const students = data.filter((u) => u.id !== user?.id && u.role === 'STUDENT');
        setUsers(students);
      })
      .catch(() => setError('사용자 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const allChecked = filtered.length > 0 && filtered.every((u) => selected.has(u.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.add(u.id));
        return next;
      });
    }
  };

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!selectedCourse?.id) {
      alert('과목이 선택되지 않았습니다.');
      return;
    }
    if (selected.size === 0) return;
    setSaving(true);
    setSaveResult(null);
    let success = 0;
    let fail = 0;
    await Promise.all(
      [...selected].map((userId) =>
        createCourseUser({ courseId: selectedCourse.id, userId, courseRole: 'STUDENT' })
          .then(() => success++)
          .catch(() => fail++),
      ),
    );
    setSaving(false);
    setSaveResult({ success, fail });
    setSelected(new Set());
  };

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[20px] leading-[28px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-52 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-full max-w-[1330px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath="/instructor/manage-students" />}>
          <div>
            {/* 페이지 헤더 */}
            <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">수강생 추가</h2>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
                <span>›</span>
                <span>{selectedCourse?.name || '과목 미선택'}</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">수강생 추가</span>
              </div>
            </div>

            {/* 과목 미선택 경고 */}
            {!selectedCourse && (
              <div className="mb-4 border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-600">
                과목이 선택되지 않았습니다.{' '}
                <button onClick={() => navigate('/courses')} className="font-bold underline">
                  과목 선택하기
                </button>
              </div>
            )}

            {/* 결과 알림 */}
            {saveResult && (
              <div className={`mb-4 border px-4 py-2 text-sm ${saveResult.fail === 0 ? 'border-[#c8dfe3] bg-[#eaf4f6] text-[#1a6d7e]' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                {saveResult.success}명 추가 완료{saveResult.fail > 0 && `, ${saveResult.fail}명 실패 (이미 등록된 학생일 수 있습니다)`}
              </div>
            )}

            {/* 검색 + 추가 버튼 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex justify-center flex-1">
                <div className="flex w-[360px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름 / 이메일 검색"
                    className="w-full border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
                  />
                  <button className="bg-[#555] px-5 py-1.5 text-sm font-bold text-white">search</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">선택: {selected.size}명</span>
                <button
                  onClick={handleAdd}
                  disabled={selected.size === 0 || saving || !selectedCourse}
                  className="bg-[#4d4d4d] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {saving ? '추가 중...' : '수강생 추가'}
                </button>
              </div>
            </div>

            {/* 학생 테이블 */}
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-red-500">{error}</div>
            ) : (
              <table className="w-full border-t-2 border-[#7f7f7f] border-b border-x border-[#d3d3d3] text-center text-[13px]">
                <thead className="bg-[#f3f3f3]">
                  <tr className="border-b border-[#d3d3d3]">
                    <th className="w-12 py-2.5 font-bold text-gray-600">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        disabled={filtered.length === 0}
                      />
                    </th>
                    <th className="w-12 py-2.5 font-bold text-gray-600">번호</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">이름</th>
                    <th className="px-4 py-2.5 text-left font-bold text-gray-600">이메일</th>
                    <th className="w-24 py-2.5 font-bold text-gray-600">역할</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-gray-400">
                        {search ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u, idx) => {
                      const isChecked = selected.has(u.id);
                      return (
                        <tr
                          key={u.id}
                          onClick={() => toggle(u.id)}
                          className={`cursor-pointer border-b border-[#e2e2e2] ${isChecked ? 'bg-[#e8f4f7]' : 'hover:bg-[#f0f7f9]'}`}
                        >
                          <td className="py-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(u.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-left font-semibold text-[#333]">{u.name}</td>
                          <td className="px-4 py-3 text-left text-gray-600">{u.email}</td>
                          <td className="py-3">
                            <span className={`rounded-sm px-2 py-0.5 text-[11px] font-bold ${u.role === 'STUDENT' ? 'bg-[#e8f4f7] text-[#1a6d7e]' : 'bg-gray-100 text-gray-500'}`}>
                              {ROLE_KO[u.role] ?? u.role}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            {/* 하단 카운트 */}
            {!loading && !error && (
              <div className="border border-t-0 border-[#d3d3d3] bg-[#f8f8f8] px-4 py-2 text-right text-sm text-gray-400">
                전체 {filtered.length}명
              </div>
            )}
          </div>
        </MainLayout>
        <Footer />
      </div>
    </div>
  );
};

export default CourseStudentManagePage;
