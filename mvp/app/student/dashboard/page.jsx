'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getStudentCourses,
  getStudentAssignmentsByCourse,
  getMySubmissions,
} from '../../../lib/api';

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  : '-';

const getStatus = (openAt, dueAt) => {
  const now = new Date();
  if (openAt && new Date(openAt) > now) return { label: '예정', cls: 'text-slate-400', dot: 'bg-slate-300' };
  if (dueAt && new Date(dueAt) < now) return { label: '종료', cls: 'text-slate-400', dot: 'bg-slate-300' };
  return { label: '진행중', cls: 'text-[#146E7A] font-semibold', dot: 'bg-[#146E7A]' };
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sections, setSections] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cv_student_token');
    const userData = localStorage.getItem('cv_student_user');
    if (!token || !userData) { router.push('/student'); return; }

    let parsed;
    try { parsed = JSON.parse(userData); } catch { router.push('/student'); return; }
    setUser(parsed);

    const load = async () => {
      try {
        const [courses, subs] = await Promise.all([
          getStudentCourses().catch(() => []),
          getMySubmissions().catch(() => []),
        ]);

        const map = {};
        subs.forEach((s) => { map[s.assignmentId] = s; });
        setSubmissionMap(map);

        const built = await Promise.all(
          courses.map(async (course) => {
            const assignments = await getStudentAssignmentsByCourse(course.id).catch(() => []);
            return { course, assignments };
          })
        );

        setSections(built.filter((s) => s.assignments.length > 0));
      } catch {
        setError('데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => {
    localStorage.removeItem('cv_student_token');
    localStorage.removeItem('cv_student_user');
    router.push('/student');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0ee]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#146E7A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0ee]">
      {/* 헤더 — HUFS Navy */}
      <header className="bg-[#002D56] shadow-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              Code<span className="text-[#6EC6CF]">Viva</span>
            </span>
            {user && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-medium text-blue-100">
                {user.name}
              </span>
            )}
          </div>
          <button onClick={logout} className="text-xs text-blue-200 hover:text-white transition-colors">
            로그아웃
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {sections.length === 0 && !error ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">수강 중인 과목이 없습니다.</p>
            <p className="mt-1 text-xs text-slate-400">교수님께 수강 등록을 요청하세요.</p>
          </div>
        ) : (
          sections.map(({ course, assignments }) => (
            <section key={course.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* 과목 헤더 */}
              <div className="border-b border-slate-200 bg-[#002D56]/[0.05] px-6 py-4">
                <h2 className="text-[15px] font-bold tracking-tight text-[#002D56]">
                  {course.name}
                </h2>
              </div>

              {/* 과제 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <th className="px-6 py-3 text-left">과제명</th>
                      <th className="w-20 px-4 py-3 text-center">상태</th>
                      <th className="w-36 px-4 py-3 text-center">마감일</th>
                      <th className="w-20 px-4 py-3 text-center">제출</th>
                      <th className="w-28 px-4 py-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((a) => {
                      const status = getStatus(a.openAt, a.dueAt);
                      const isDone = !!submissionMap[a.id];
                      const isOpen = status.label === '진행중';
                      const href = `/submit?t=${btoa(String(a.id))}`;
                      return (
                        <tr key={a.id} className="transition hover:bg-slate-50/80">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{a.title}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 text-xs ${status.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-xs text-slate-500">
                            {fmtDate(a.dueAt)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {isDone ? (
                              <span className="inline-block whitespace-nowrap rounded-full bg-[#146E7A]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#146E7A] ring-1 ring-[#146E7A]/20">
                                제출완료
                              </span>
                            ) : (
                              <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-400">
                                미제출
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {!isDone && isOpen ? (
                              <Link
                                href={href}
                                className="inline-block whitespace-nowrap rounded-lg bg-[#146E7A] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f5560]"
                              >
                                제출하기
                              </Link>
                            ) : isDone ? (
                              <Link
                                href={href}
                                className="inline-block whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:bg-slate-50"
                              >
                                보기
                              </Link>
                            ) : (
                              <span className="text-[11px] text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
