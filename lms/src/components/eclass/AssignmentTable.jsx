import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { getAssignmentsByCourse } from '../../api/assignments';
import { getMySubmissions } from '../../api/submissions';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

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
  if (openAt && new Date(openAt) > now) return '예정';
  if (dueAt && new Date(dueAt) < now) return '종료';
  return '진행중';
};

const GRADE_LABEL = { GRADE_1: 'A', GRADE_2: 'B', GRADE_3: 'C', GRADE_4: 'D', GRADE_5: 'F' };

const AssignmentTable = ({ role }) => {
  const { user } = useAuth();
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();

  const isInstructor = role === 'instructor';
  const [assignments, setAssignments] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!selectedCourse?.id) return;
    setLoading(true);
    setError('');

    const fetchAll = async () => {
      const [aList, mySubmissions] = await Promise.all([
        getAssignmentsByCourse(selectedCourse.id),
        isInstructor ? Promise.resolve([]) : getMySubmissions().catch(() => []),
      ]);
      setAssignments(aList);
      if (!isInstructor) {
        const map = {};
        mySubmissions.forEach((s) => { map[s.assignmentId] = s; });
        setSubmissionMap(map);
      }
    };

    fetchAll()
      .catch(() => setError('과제 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedCourse?.id, isInstructor]);

  const filtered = assignments.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (val) => { setSearch(val); setCurrentPage(1); };

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

      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-1 justify-center">
          <div className="flex w-[360px]">
            <input
              type="text"
              placeholder="검색"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border border-r-0 border-gray-300 px-3 py-1.5 text-xs focus:border-gray-500 focus:outline-none"
            />
            <button className="bg-[#555] px-5 py-1.5 text-xs font-bold text-white">search</button>
          </div>
        </div>
        {isInstructor && (
          <Link
            to="/instructor/assignment-create"
            className="rounded-sm bg-[#4d4d4d] px-4 py-1.5 text-xs font-bold text-white"
          >
            과제 출제
          </Link>
        )}
      </div>

      {loading && <div className="py-12 text-center text-xs text-gray-400">불러오는 중...</div>}
      {error && <div className="py-6 text-center text-xs text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden border border-[#d3d3d3]">
          <table className="w-full border-t-2 border-[#7f7f7f] text-center text-[12px]">
            <thead className="bg-[#8c8c8c] text-white">
              <tr>
                <th className="w-10 py-2.5 font-bold">번호</th>
                <th className="px-3 py-2.5 text-left font-bold">제목</th>
                <th className="w-16 py-2.5 font-bold">진행</th>
                <th className="w-14 py-2.5 font-bold">제출</th>
                <th className="w-14 py-2.5 font-bold">등급</th>
                <th className="w-14 py-2.5 font-bold">배점</th>
                <th className="w-36 py-2.5 font-bold">마감일</th>
              </tr>
            </thead>
            <tbody className="text-gray-500">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-gray-400">
                    {assignments.length === 0 ? '등록된 과제가 없습니다.' : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : (
                paged.map((assignment, idx) => {
                  const globalIdx = filtered.length - ((currentPage - 1) * PAGE_SIZE + idx);
                  const status = getStatus(assignment.openAt, assignment.dueAt);
                  const sub = submissionMap[assignment.id];
                  const grade = sub?.grade ? GRADE_LABEL[sub.grade] : null;

                  return (
                    <tr
                      key={assignment.id}
                      className="cursor-pointer border-b border-[#e2e2e2] hover:bg-[#f5f5f5]"
                      onClick={() => handleRowClick(assignment.id)}
                    >
                      <td className="py-2.5 text-gray-400">{globalIdx}</td>
                      <td className="px-3 py-2.5 text-left">
                        <span className="text-gray-700">{assignment.title}</span>
                        <span className="ml-2 text-[11px] text-gray-400">온라인</span>
                      </td>
                      <td className="py-2.5">{status}</td>
                      <td className="py-2.5">
                        {isInstructor ? '-' : sub ? '제출' : '미제출'}
                      </td>
                      <td className="py-2.5">
                        {isInstructor ? '-' : grade ?? '-'}
                      </td>
                      <td className="py-2.5">
                        {assignment.score != null ? assignment.score : '-'}
                      </td>
                      <td className="py-2.5">{formatDate(assignment.dueAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};

export default AssignmentTable;
