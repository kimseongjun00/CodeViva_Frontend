import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { getAssignmentsByCourse } from '../../api/assignments';

const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = d.getHours();
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  return `${y}.${mo}.${day} ${ampm} ${h12}:${mi}`;
};

const getStatus = (openAt, dueAt) => {
  const now = new Date();
  if (openAt && new Date(openAt) > now) return { label: '예정', cls: 'text-gray-400' };
  if (dueAt && new Date(dueAt) < now) return { label: '종료', cls: 'text-gray-400' };
  return { label: '진행중', cls: 'font-bold text-[#1a6d7e]' };
};

const AssignmentTable = ({ role }) => {
  const { user } = useAuth();
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();

  const isInstructor = role === 'instructor';
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedCourse?.id) return;
    setLoading(true);
    setError('');
    getAssignmentsByCourse(selectedCourse.id)
      .then(setAssignments)
      .catch(() => setError('과제 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedCourse?.id]);

  const filtered = assignments.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRowClick = (assignmentId) => {
    if (isInstructor) {
      navigate(`/instructor/assignment-detail?assignmentId=${assignmentId}`);
    } else {
      navigate(`/student/assignment-submit?assignmentId=${assignmentId}`);
    }
  };

  if (!selectedCourse) {
    return (
      <div className="border border-[#d3d3d3] bg-white py-12 text-center">
        <p className="mb-3 text-sm text-gray-500">수강 과목을 먼저 선택해주세요.</p>
        <Link to="/courses" className="rounded bg-[#1a6d7e] px-4 py-1.5 text-xs font-bold text-white">
          과목 선택하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
        <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">과제</h2>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
          <span>›</span>
          <span>{selectedCourse.name}</span>
          <span>›</span>
          <span className="font-bold text-[#1a6d7e]">과제</span>
        </div>
      </div>

      {/* 검색 + 출제 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex justify-center flex-1">
          <div className="flex w-[360px]">
            <input
              type="text"
              placeholder="검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none"
            />
            <button className="bg-[#555] px-5 py-1.5 text-sm font-bold text-white">search</button>
          </div>
        </div>
        {isInstructor && (
          <Link
            to="/instructor/assignment-create"
            className="bg-[#4d4d4d] px-4 py-1.5 text-sm font-bold text-white"
          >
            과제 출제
          </Link>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      )}
      {error && (
        <div className="py-6 text-center text-xs text-red-500">{error}</div>
      )}

      {!loading && !error && (
        <table className="w-full border-t-2 border-[#7f7f7f] border-b border-x border-[#d3d3d3] text-center text-[16px]">
          <thead className="bg-[#f3f3f3]">
            <tr className="border-b border-[#d3d3d3]">
              <th className="w-12 py-2.5 font-bold text-gray-600">번호</th>
              <th className="w-10 py-2.5 font-bold text-gray-600">중요</th>
              <th className="w-[340px] max-w-[340px] px-4 py-2.5 text-left font-bold text-gray-600">제목</th>
              <th className="w-20 py-2.5 font-bold text-gray-600">진행</th>
              <th className="w-14 py-2.5 font-bold text-gray-600">제출</th>
              <th className="w-16 py-2.5 font-bold text-gray-600">점수</th>
              <th className="w-16 py-2.5 font-bold text-gray-600">배점</th>
              <th className="w-40 py-2.5 font-bold text-gray-600">마감일</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-gray-400">
                  {assignments.length === 0 ? '등록된 과제가 없습니다.' : '검색 결과가 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((assignment, idx) => {
                const status = getStatus(assignment.openAt, assignment.dueAt);
                return (
                  <tr
                    key={assignment.id}
                    className="cursor-pointer border-b border-[#e2e2e2] hover:bg-[#f0f7f9]"
                    onClick={() => handleRowClick(assignment.id)}
                  >
                    <td className="py-3">{filtered.length - idx}</td>
                    <td className="py-3 text-gray-300">-</td>
                    <td className="w-[340px] max-w-[340px] px-4 py-3 text-left">
                      <div className="truncate font-semibold text-[#333]">{assignment.title}</div>
                      <div className="mt-0.5 text-[11px] text-gray-400">온라인</div>
                    </td>
                    <td className={`py-3 ${status.cls}`}>{status.label}</td>
                    <td className="py-3 text-gray-300">-</td>
                    <td className="py-3 text-gray-400">비공개</td>
                    <td className="py-3">
                      {assignment.score != null ? assignment.score : '-'}
                    </td>
                    <td className="py-3 text-gray-600">{formatDate(assignment.dueAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssignmentTable;
