'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, createSubmission } from '../../lib/api';

const apiClient = async (path, token) => {
  const res = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

function SubmitInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');

  const [step, setStep] = useState('identify'); // identify | submit
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [assignment, setAssignment] = useState(null);
  const [token, setToken] = useState(null);

  const [identifying, setIdentifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!assignmentId) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">올바른 과제 링크가 아닙니다.</p>
            <p className="mt-2 text-sm text-slate-400">교수님께 받은 링크로 다시 접속해주세요.</p>
          </div>
        </main>
      </div>
    );
  }

  // 학번 확인 → 로그인 → 과제 정보 로드
  const handleIdentify = async () => {
    if (!studentId.trim()) { setError('학번을 입력해주세요.'); return; }
    setIdentifying(true);
    setError('');
    try {
      const { token: t } = await login({
        email: `${studentId.trim()}@codeviva.kr`,
        password: studentId.trim(),
      });
      localStorage.setItem('cv_student_token', t); // 교수 cv_prof_token과 분리
      setToken(t);

      const a = await apiClient(`/assignments/${assignmentId}`, t);
      setAssignment(a);
      setStep('submit');
    } catch (e) {
      const s = e?.message;
      if (s === '401' || s === '400') {
        setError('등록되지 않은 학번입니다. 교수님께 수강 등록을 요청하세요.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIdentifying(false);
    }
  };

  // 코드 제출
  const handleSubmit = async () => {
    if (!name.trim())  { setError('이름을 입력해주세요.'); return; }
    if (!code.trim())  { setError('코드를 입력해주세요.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await createSubmission({
        assignmentId: Number(assignmentId),
        code: code.trim(),
      });
      router.push(`/submit/verify?submissionId=${result.id}`);
    } catch (e) {
      const s = e?.message;
      const body = e?.body ?? '';

      if (s === '403') {
        setError('수강 등록이 되지 않았습니다. 교수님께 문의하세요.');
      } else if (s === '400' && body.includes('already submitted')) {
        setError('이미 제출 완료한 과제입니다.');
      } else if (s === '400' && body.includes('not open')) {
        setError('아직 과제 제출 기간이 아닙니다.');
      } else if (s === '401') {
        setError('인증이 만료됐습니다. 페이지를 새로고침해주세요.');
      } else {
        setError(`제출에 실패했습니다. (${s}${body ? ': ' + body : ''})`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '-';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* STEP 1: 학번 확인 */}
          {step === 'identify' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="mb-1 text-2xl font-bold text-slate-900">과제 확인</h1>
              <p className="mb-8 text-sm text-slate-500">학번을 입력하면 과제 내용을 확인할 수 있습니다.</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    학번 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
                      placeholder="20201234"
                      className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1a6d7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6d7e]/20"
                    />
                    <button
                      onClick={handleIdentify}
                      disabled={identifying}
                      className="h-11 rounded-xl bg-[#1a6d7e] px-6 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
                    >
                      {identifying ? '확인 중...' : '확인'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: 과제 정보 + 코드 제출 */}
          {step === 'submit' && assignment && (
            <div className="space-y-5">
              {/* 과제 정보 카드 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#1a6d7e]">
                  과제 안내
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{assignment.title}</h2>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    <span className="font-semibold text-slate-700">마감</span>{' '}
                    {fmtDate(assignment.dueAt)}
                  </span>
                  {assignment.score != null && (
                    <span>
                      <span className="font-semibold text-slate-700">배점</span>{' '}
                      {assignment.score}점
                    </span>
                  )}
                </div>

                {assignment.description && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {assignment.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 제출 폼 카드 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-slate-900">코드 제출</h3>

                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1a6d7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6d7e]/20"
                    />
                    <p className="mt-1 text-xs text-slate-400">학번: {studentId}</p>
                  </div>

                  {/* 코드 에디터 */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      제출 코드 <span className="text-red-500">*</span>
                    </label>
                    <div className="overflow-hidden rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2.5">
                        <span className="font-mono text-xs text-slate-400">코드 입력</span>
                        <div className="flex gap-1.5">
                          <span className="h-3 w-3 rounded-full bg-red-500/70" />
                          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                          <span className="h-3 w-3 rounded-full bg-green-500/70" />
                        </div>
                      </div>
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// 구현한 코드를 여기에 붙여넣거나 직접 입력하세요"
                        className="h-72 w-full resize-none bg-slate-900 p-5 font-mono text-sm leading-relaxed text-slate-300 placeholder-slate-600 focus:outline-none"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-6">
                  <p className="text-xs text-slate-400">제출 후 AI 음성 인터뷰 3문항이 진행됩니다.</p>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-xl bg-[#1a6d7e] px-8 py-3 text-sm font-bold text-white transition hover:bg-teal-800 active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? '분석 중...' : '제출하기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100 bg-white px-8 py-5">
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        Code<span className="text-[#1a6d7e]">Viva</span>
      </span>
    </header>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-400">로딩 중...</p>
      </div>
    }>
      <SubmitInner />
    </Suspense>
  );
}
