import React, { useState, useCallback } from 'react';
import { getAssignmentsByCourse } from '../../api/assignments';
import { getSubmissionsByAssignment } from '../../api/submissions';
import { getAnswersBySubmission } from '../../api/submissionAnswers';

const ADMIN_PASSWORD = 'codeviva2025';

const GRADE_CONFIG = {
  A: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'A' },
  B: { bg: 'bg-sky-100',     text: 'text-sky-700',     label: 'B' },
  C: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'C' },
  D: { bg: 'bg-orange-100',  text: 'text-orange-700',  label: 'D' },
  F: { bg: 'bg-red-100',     text: 'text-red-700',     label: 'F' },
};

const GRADE_SCORES = { A: 5, B: 4, C: 3, D: 2, F: 1 };

const getOverallGrade = (answers) => {
  if (!answers?.length) return null;
  const grades = answers.map((a) => a.evaluationStatus).filter((g) => GRADE_CONFIG[g]);
  if (!grades.length) return null;
  const avg = grades.reduce((s, g) => s + (GRADE_SCORES[g] ?? 0), 0) / grades.length;
  if (avg >= 4.5) return 'A';
  if (avg >= 3.5) return 'B';
  if (avg >= 2.5) return 'C';
  if (avg >= 1.5) return 'D';
  return 'F';
};

const parseStudentInfo = (description) => {
  try {
    const parsed = JSON.parse(description);
    return parsed.studentInfo ?? null;
  } catch {
    return null;
  }
};

const GradeBadge = ({ grade }) => {
  if (!grade) return <span className="text-xs text-slate-300">미완료</span>;
  const cfg = GRADE_CONFIG[grade];
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${cfg.bg} ${cfg.text}`}>
      {grade}
    </span>
  );
};

/* ─── 과목 결과 패널 ─── */
const CourseResultPanel = ({ courseId }) => {
  const [assignments, setAssignments] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAssignmentsByCourse(courseId);
      setAssignments(data);
    } catch {
      setError('과목 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadSubmissions = useCallback(async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    setAnswersMap({});
    try {
      const subs = await getSubmissionsByAssignment(assignment.id);
      setSubmissions(subs);
      // 모든 제출의 답변 로드
      const entries = await Promise.all(
        subs.map(async (s) => {
          try {
            const answers = await getAnswersBySubmission(s.id);
            return [s.id, Array.isArray(answers) ? answers : []];
          } catch {
            return [s.id, []];
          }
        }),
      );
      setAnswersMap(Object.fromEntries(entries));
    } catch {
      setError('제출 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!assignments) {
    return (
      <button
        onClick={loadAssignments}
        disabled={loading}
        className="rounded-lg bg-[#1a6d7e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? '불러오는 중...' : '과제 목록 조회'}
      </button>
    );
  }

  if (!selectedAssignment) {
    return (
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-600">과제 선택</p>
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-400">등록된 과제가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <button
                key={a.id}
                onClick={() => loadSubmissions(a)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:bg-teal-50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">{a.title}</div>
                  <div className="text-xs text-slate-400">ID: {a.id}</div>
                </div>
                <span className="text-xs text-[#1a6d7e]">결과 보기 →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0, null: 0 };
  submissions.forEach((s) => {
    const g = getOverallGrade(answersMap[s.id]);
    gradeCount[g ?? 'null']++;
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800">{selectedAssignment.title}</h4>
          <p className="text-xs text-slate-400">총 {submissions.length}명 제출</p>
        </div>
        <button
          onClick={() => setSelectedAssignment(null)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ← 목록
        </button>
      </div>

      {/* 등급 분포 */}
      <div className="mb-4 flex gap-2">
        {Object.entries(GRADE_CONFIG).map(([g, cfg]) => (
          <div key={g} className={`flex flex-1 flex-col items-center rounded-lg px-2 py-2 ${cfg.bg}`}>
            <span className={`text-lg font-extrabold ${cfg.text}`}>{g}</span>
            <span className={`text-xs font-bold ${cfg.text}`}>{gradeCount[g]}명</span>
          </div>
        ))}
        <div className="flex flex-1 flex-col items-center rounded-lg bg-slate-100 px-2 py-2">
          <span className="text-lg font-extrabold text-slate-400">-</span>
          <span className="text-xs font-bold text-slate-400">{gradeCount['null']}명</span>
        </div>
      </div>

      {/* 학생 목록 테이블 */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">불러오는 중...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">학번</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">학과</th>
                <th className="px-4 py-3 text-center">학년</th>
                <th className="px-4 py-3 text-center">AI 등급</th>
                <th className="px-4 py-3 text-center">질문 수</th>
                <th className="px-4 py-3 text-xs text-slate-400">제출일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    제출된 과제가 없습니다.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const info = parseStudentInfo(sub.description);
                  const answers = answersMap[sub.id];
                  const grade = getOverallGrade(answers);
                  const submittedAt = sub.createdAt
                    ? new Date(sub.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {info?.studentId ?? sub.userId ?? '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {info?.name ?? sub.userName ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {info?.department ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {info?.grade ? `${info.grade}학년` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <GradeBadge grade={grade} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">
                        {answers?.length ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{submittedAt}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
};

/* ─── 어드민 메인 ─── */
const AdminDashboardPage = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [courseIdInput, setCourseIdInput] = useState('');
  const [panels, setPanels] = useState([]); // { courseId, label }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
    }
  };

  const addCourse = () => {
    const id = courseIdInput.trim();
    if (!id || panels.find((p) => p.courseId === id)) return;
    setPanels((prev) => [...prev, { courseId: id, label: `과목 ID: ${id}` }]);
    setCourseIdInput('');
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-8">
          <div className="mb-6 text-center">
            <div className="mb-1 text-2xl font-extrabold text-teal-400">CodeViva</div>
            <p className="text-sm text-slate-400">관리자 로그인</p>
          </div>
          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="mb-3 h-11 w-full rounded-xl border border-slate-600 bg-slate-700 px-4 text-sm text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none"
          />
          {authError && <p className="mb-3 text-xs text-red-400">{authError}</p>}
          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-teal-500 py-3 text-sm font-bold text-white hover:bg-teal-400"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold text-[#1a6d7e]">CodeViva</span>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">Admin</span>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">과목별 검증 결과</h1>

        {/* 과목 ID 추가 */}
        <div className="mb-8 flex gap-3">
          <input
            type="number"
            placeholder="과목 ID 입력"
            value={courseIdInput}
            onChange={(e) => setCourseIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCourse()}
            className="h-10 w-48 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none"
          />
          <button
            onClick={addCourse}
            disabled={!courseIdInput.trim()}
            className="rounded-lg bg-[#1a6d7e] px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            + 과목 추가
          </button>
        </div>

        {panels.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400">
            <p className="mb-2 text-4xl">📋</p>
            <p className="text-sm">과목 ID를 입력하여 결과를 조회하세요.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {panels.map(({ courseId }) => (
              <div key={courseId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700">과목 ID: {courseId}</h3>
                  <button
                    onClick={() => setPanels((p) => p.filter((x) => x.courseId !== courseId))}
                    className="text-xs text-slate-400 hover:text-red-400"
                  >
                    제거
                  </button>
                </div>
                <CourseResultPanel courseId={courseId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
