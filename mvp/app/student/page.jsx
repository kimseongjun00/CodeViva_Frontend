'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/api';

export default function StudentLogin() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!studentId.trim()) { setError('학번을 입력해주세요.'); return; }
    if (!password) { setError('비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const { token } = await login({
        email: `${studentId.trim()}@codeviva.kr`,
        password,
      });
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const me = await res.json();
      localStorage.setItem('cv_student_token', token);
      localStorage.setItem('cv_student_user', JSON.stringify(me));
      if (password === studentId.trim()) {
        router.push('/student/change-password');
      } else {
        router.push('/student/dashboard');
      }
    } catch (e) {
      const s = e?.message;
      if (s === '401' || s === '400') setError('학번 또는 비밀번호가 올바르지 않습니다.');
      else setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 좌: 브랜드 패널 */}
      <div className="hidden flex-col justify-between bg-[#0b3d47] px-12 py-14 lg:flex lg:w-[400px] xl:w-[440px]">
        <div>
          <div className="text-[22px] font-extrabold tracking-tight text-white">
            Code<span className="text-[#4ecbdb]">Viva</span>
          </div>
          <p className="mt-1.5 text-[12px] text-teal-300/60">학생 포털</p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-[28px] font-bold leading-snug tracking-tight text-white">
              AI 코드 이해도<br />검증 플랫폼
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-teal-200/60">
              과제를 제출하고 음성 인터뷰로<br />코딩 실력을 증명하세요.
            </p>
          </div>
          <div className="space-y-3">
            {[
              ['코드 제출', '대시보드에서 과제를 선택해 코드 제출'],
              ['AI 음성 인터뷰', '코드 기반 3가지 질문에 음성으로 답변'],
              ['이해도 평가', '답변 분석 후 등급 자동 산출'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-[9px] font-bold text-teal-300">
                  {i + 1}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-teal-100/80">{title}</p>
                  <p className="text-[11px] text-teal-300/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-teal-400/30">© 2025 CodeViva</p>
      </div>

      {/* 우: 폼 */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-14">
        <div className="w-full max-w-[340px]">
          <p className="mb-8 text-lg font-extrabold tracking-tight text-slate-900 lg:hidden">
            Code<span className="text-[#1a6d7e]">Viva</span>
          </p>

          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">학생 로그인</h1>
          <p className="mt-1 text-[13px] text-slate-400">학번과 비밀번호로 접속하세요.</p>

          <div className="mt-7 space-y-4">
            <Field label="학번">
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="20201234"
                className={inp}
              />
            </Field>
            <Field label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호"
                className={inp}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">초기 비밀번호는 학번과 동일합니다.</p>
            </Field>
          </div>

          {error && <p className="mt-4 text-[13px] text-red-500">· {error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1a6d7e] text-sm font-bold text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <><Spin /> 로그인 중...</> : '로그인'}
          </button>

          <p className="mt-5 text-center text-[12px] text-slate-400">
            계정이 없으신가요? 담당 교수님께 수강 등록을 요청하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

const inp = 'h-11 w-full rounded-lg border border-slate-200 px-3.5 text-sm text-slate-900 placeholder-slate-300 transition focus:border-[#1a6d7e] focus:outline-none focus:ring-1 focus:ring-[#1a6d7e]/25';

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Spin() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
