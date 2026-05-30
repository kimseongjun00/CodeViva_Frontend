'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSubmission, getSubmission } from '../../lib/api';

const apiClient = async (path, token) => {
  const res = await fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

function StepBar({ step }) {
  const steps = ['코드 제출', 'AI 인터뷰'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-2 ${active ? 'opacity-100' : done ? 'opacity-50' : 'opacity-25'}`}>
              <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active || done ? 'bg-[#146E7A] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-6 ${step > n ? 'bg-[#146E7A]/60' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SubmitInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const _t = searchParams.get('t');
  const assignmentId = _t ? atob(_t) : searchParams.get('assignmentId');

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [existingCode, setExistingCode] = useState(null);
  const [existingSubmissionId, setExistingSubmissionId] = useState(null);
  const [existingStatus, setExistingStatus] = useState(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cv_student_token');
    const userData = localStorage.getItem('cv_student_user');
    if (!token || !userData) {
      setIsLoggedIn(false);
      setAuthChecked(true);
      return;
    }
    setUser(JSON.parse(userData));
    setIsLoggedIn(true);
    setAuthChecked(true);
    if (assignmentId) {
      setLoadingAssignment(true);
      Promise.all([
        apiClient(`/assignments/${assignmentId}`, token),
        apiClient('/submissions/my', token).catch(() => []),
      ]).then(async ([a, subs]) => {
        setAssignment(a);
        const existing = subs.find((s) => String(s.assignmentId) === String(assignmentId));
        if (existing) {
          const full = await getSubmission(existing.id).catch(() => null);
          setExistingCode(full?.code ?? '');
          setExistingSubmissionId(existing.id);
          setExistingStatus(full?.aiValidationStatus ?? existing.aiValidationStatus ?? null);
        }
      }).catch(() => setError('과제 정보를 불러오지 못했습니다.'))
        .finally(() => setLoadingAssignment(false));
    }
  }, [assignmentId]);

  if (!assignmentId) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-3 text-2xl text-slate-300">⚠</div>
          <p className="text-sm font-medium text-slate-700">올바른 과제 링크가 아닙니다.</p>
          <p className="mt-1 text-xs text-slate-400">교수님께 받은 링크로 다시 접속해주세요.</p>
        </div>
      </Shell>
    );
  }

  if (!authChecked || loadingAssignment) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#146E7A] border-t-transparent" />
        </div>
      </Shell>
    );
  }

  if (!isLoggedIn) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-3 text-2xl text-slate-300">🔒</div>
          <p className="text-sm font-medium text-slate-700">로그인이 필요합니다.</p>
          <p className="mt-1 text-xs text-slate-400">학생 로그인 후 다시 접속해주세요.</p>
          <a href="/student" className="mt-6 rounded-lg bg-[#146E7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">
            학생 로그인
          </a>
        </div>
      </Shell>
    );
  }

  if (!assignment) {
    return (
      <Shell step={1}>
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-medium text-slate-700">과제 정보를 불러오지 못했습니다.</p>
          <p className="mt-1 text-xs text-slate-400">링크를 확인하거나 교수님께 문의하세요.</p>
        </div>
      </Shell>
    );
  }

  const handleSubmit = async () => {
    if (!code.trim()) { setError('코드를 입력해주세요.'); return; }
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
      if (s === '403') setError('수강 등록이 되지 않았습니다. 교수님께 문의하세요.');
      else if (s === '400' && body.includes('not open')) setError('아직 과제 제출 기간이 아닙니다.');
      else if (s === '401') setError('인증이 만료됐습니다. 다시 로그인해주세요.');
      else setError(`제출에 실패했습니다. (${s}${body ? ': ' + body : ''})`);
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '-';

  const studentId = user?.email?.replace('@codeviva.kr', '') ?? '';
  const isSubmitted = existingCode !== null;
  const now = new Date();
  const isPastDue = assignment.dueAt && new Date(assignment.dueAt) < now;
  const isNotYetOpen = assignment.openAt && new Date(assignment.openAt) > now;

  /* ── 공통: 과제 정보 사이드바 ── */
  const AssignmentAside = () => (
    <aside className="shrink-0 overflow-y-auto border-r border-slate-200 bg-[#f8fafb] lg:w-[360px]">
      <div className="px-8 py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#146E7A]">과제</p>
        <h2 className="mt-2 text-[22px] font-bold leading-tight tracking-tight text-slate-900">
          {assignment.title}
        </h2>

        {/* 마감·배점 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">마감일</p>
            <p className="mt-1.5 text-[13px] font-semibold text-slate-800">{fmtDate(assignment.dueAt)}</p>
          </div>
          {assignment.score != null && (
            <div className="rounded-xl bg-slate-50 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">배점</p>
              <p className="mt-1.5 text-[13px] font-semibold text-slate-800">{assignment.score}점</p>
            </div>
          )}
        </div>

        {/* 과제 내용 */}
        {assignment.description && (
          <div className="mt-7">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">과제 내용</p>
            <p className="text-[14px] leading-relaxed text-slate-600 whitespace-pre-line">
              {assignment.description}
            </p>
          </div>
        )}

        {/* PDF 첨부 */}
        {assignment.attachmentDownloadUrl && (
          <a
            href={assignment.attachmentDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-[#146E7A] transition hover:bg-teal-50 hover:border-teal-200"
          >
            <span className="text-base">📄</span>
            <span className="truncate">{assignment.attachmentOriginalName || '과제 PDF 보기'}</span>
            <span className="ml-auto shrink-0 text-[11px] text-slate-400">새 탭 →</span>
          </a>
        )}

        {/* 학생 */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#146E7A]/10 text-[15px] font-bold text-[#146E7A]">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] text-slate-400">{studentId}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-[#146E7A]">
              인증됨
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  /* ── 제출 완료: read-only ── */
  if (isSubmitted) {
    const STATUS_CFG = {
      QUESTION_GENERATING:    { badge: '질문 생성 중', badgeCls: 'bg-amber-50 text-amber-600', desc: 'AI가 인터뷰 질문을 생성하고 있습니다. 잠시 후 대시보드에서 확인하세요.' },
      AWAITING_AUDIO_ANSWERS: { badge: '인터뷰 필요',  badgeCls: 'bg-blue-50 text-blue-600',   desc: 'AI 음성 인터뷰를 완료해주세요.' },
      AWAITING_EVALUATION:    { badge: '제출완료',     badgeCls: 'bg-teal-50 text-[#146E7A]',  desc: '인터뷰가 완료되었습니다. 교수님이 평가를 시작하면 자동으로 진행됩니다.' },
      EVALUATING:             { badge: '제출완료',     badgeCls: 'bg-teal-50 text-[#146E7A]',  desc: '인터뷰가 완료되었습니다. 교수님이 평가를 시작하면 자동으로 진행됩니다.' },
      EVALUATED:              { badge: '제출완료',     badgeCls: 'bg-teal-50 text-[#146E7A]',  desc: '제출 및 평가가 모두 완료되었습니다.' },
      EVALUATION_FAILED:      { badge: '제출완료',     badgeCls: 'bg-teal-50 text-[#146E7A]',  desc: '제출이 완료되었습니다.' },
    };
    const cfg = STATUS_CFG[existingStatus] ?? { badge: '제출완료', badgeCls: 'bg-teal-50 text-[#146E7A]', desc: '제출된 코드는 수정할 수 없습니다.' };
    const showInterviewBtn = existingStatus === 'AWAITING_AUDIO_ANSWERS';

    return (
      <Shell>
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden border-x border-slate-200 bg-white shadow-sm lg:flex-row">
          <AssignmentAside />
          <div className="flex min-h-0 flex-1 flex-col px-8 py-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-slate-900">제출한 코드</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badgeCls}`}>
                    {cfg.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-slate-400">{cfg.desc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showInterviewBtn && existingSubmissionId && (
                  <button
                    onClick={() => router.push(`/submit/verify?submissionId=${existingSubmissionId}`)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    AI 인터뷰 하기
                  </button>
                )}
                <a
                  href="/student/dashboard"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  대시보드로
                </a>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 shadow-lg">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-700/80 bg-[#1e2433] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">solution</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">read only</span>
              </div>
              <pre className="flex-1 overflow-y-auto bg-[#0d1117] p-5 font-mono text-[13px] leading-relaxed text-slate-300 whitespace-pre">
                {existingCode || '// 코드 내용 없음'}
              </pre>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── 미제출: 마감 or 미개방 ── */
  if (isPastDue || isNotYetOpen) {
    return (
      <Shell>
        <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden border-x border-slate-200 bg-white shadow-sm lg:flex-row">
          <AssignmentAside />
          <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <div className="mb-3 text-2xl text-slate-300">{isPastDue ? '🔒' : '⏳'}</div>
            <p className="text-sm font-semibold text-slate-700">
              {isPastDue ? '제출 기간이 종료되었습니다.' : '아직 제출 기간이 아닙니다.'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isPastDue ? `마감: ${fmtDate(assignment.dueAt)}` : `시작: ${fmtDate(assignment.openAt)}`}
            </p>
            <a href="/student/dashboard" className="mt-6 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              대시보드로
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── 미제출: 코드 에디터 ── */
  return (
    <Shell step={1}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden border-x border-slate-200 bg-white shadow-sm lg:flex-row">
        <AssignmentAside />
        <div className="flex min-h-0 flex-1 flex-col px-8 py-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">코드 제출</h3>
              <p className="mt-0.5 text-[12px] text-slate-400">
                제출 후 AI 음성 인터뷰 3문항이 진행됩니다.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="shrink-0 rounded-lg bg-[#146E7A] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? '분석 중...' : '제출하기'}
            </button>
          </div>

          {error && <ErrorMsg className="mb-3">{error}</ErrorMsg>}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 shadow-lg">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700/80 bg-[#1e2433] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="ml-1.5 font-mono text-[11px] text-slate-400">solution</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                {code ? `${code.split('\n').length} lines` : ''}
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// 구현한 코드를 여기에 붙여넣거나 직접 입력하세요"
              className="flex-1 min-h-0 w-full resize-none overflow-y-auto bg-[#0d1117] p-5 font-mono text-[13px] leading-relaxed text-slate-300 placeholder-slate-600 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ── 공통 컴포넌트 ── */

function Shell({ children, step }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0ee]">
      <header className="flex shrink-0 items-center justify-between bg-[#002D56] px-6 py-4 shadow-md">
        <span className="text-[17px] font-extrabold tracking-tight text-white">
          Code<span className="text-[#6EC6CF]">Viva</span>
        </span>
        {step && <StepBar step={step} />}
        <span className="w-24 text-right text-[11px] text-blue-200">과제 제출 포털</span>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function ErrorMsg({ children, className = '' }) {
  return (
    <p className={`mt-3 text-[13px] text-red-500 ${className}`}>
      · {children}
    </p>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#146E7A] border-t-transparent" />
      </div>
    }>
      <SubmitInner />
    </Suspense>
  );
}
