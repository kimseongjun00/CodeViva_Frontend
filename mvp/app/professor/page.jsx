'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register, getMe } from '../../lib/api';

export default function ProfessorAuth() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === 'register' && !form.name.trim()) return '이름을 입력해주세요.';
    if (!form.email.trim()) return '이메일을 입력해주세요.';
    if (!emailRe.test(form.email.trim())) return '올바른 이메일 형식이 아닙니다.';
    if (!form.password) return '비밀번호를 입력해주세요.';
    if (mode === 'register') {
      if (form.password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
      if (!/[a-zA-Z]/.test(form.password)) return '비밀번호에 영문자를 포함해야 합니다.';
      if (!/[0-9]/.test(form.password)) return '비밀번호에 숫자를 포함해야 합니다.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    setLoading(true);
    setError('');
    try {
      let token;
      if (mode === 'login') {
        const res = await login({ email: form.email, password: form.password });
        token = res.token;
      } else {
        const res = await register({ name: form.name, email: form.email, password: form.password, role: 'TEACHER' });
        token = res.token;
      }
      const me = await getMe(token);
      if (me.role !== 'TEACHER' && me.role !== 'ADMIN') {
        setError('교수자 계정이 아닙니다.');
        return;
      }
      localStorage.setItem('cv_prof_token', token);
      localStorage.setItem('cv_user', JSON.stringify(me));
      router.push('/professor/dashboard');
    } catch (e) {
      const s = e?.message;
      if (s === '401' || s === '400') setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      else if (s === '409') setError('이미 사용 중인 이메일입니다.');
      else setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── 좌: 브랜드 패널 ── */}
      <div className="hidden flex-col justify-between bg-[#0b3d47] px-12 py-14 lg:flex lg:w-[400px] xl:w-[440px]">
        <div>
          <div className="text-[22px] font-extrabold tracking-tight text-white">
            Code<span className="text-[#4ecbdb]">Viva</span>
          </div>
          <p className="mt-1.5 text-[12px] text-teal-300/60">교수자 관리 포털</p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-[28px] font-bold leading-snug tracking-tight text-white">
              AI가 검증하는<br />코드 이해도 평가
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-teal-200/60">
              과제를 출제하고 학생의 코드 이해도를<br />
              음성 인터뷰로 자동 검증하세요.
            </p>
          </div>

          <div className="space-y-3">
            {[
              ['과제 출제', '과제를 등록하고 수강 학생에게 자동 배정'],
              ['AI 자동 질문 생성', '제출된 코드 기반으로 맞춤 질문 생성'],
              ['이해도 등급 자동 산출', '음성 답변을 분석해 5단계 등급으로 평가'],
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

      {/* ── 우: 폼 ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-14">
        <div className="w-full max-w-[340px]">

          {/* 모바일 로고 */}
          <p className="mb-8 text-lg font-extrabold tracking-tight text-slate-900 lg:hidden">
            Code<span className="text-[#1a6d7e]">Viva</span>
          </p>

          {/* 헤딩 */}
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            {mode === 'login' ? '로그인' : '계정 만들기'}
          </h1>
          <p className="mt-1 text-[13px] text-slate-400">
            {mode === 'login' ? '교수자 계정으로 로그인하세요.' : '새 교수자 계정을 등록합니다.'}
          </p>

          {/* 폼 */}
          <div className="mt-7 space-y-4">
            {mode === 'register' && (
              <Field label="이름">
                <input value={form.name} onChange={set('name')} placeholder="홍길동"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className={inp} />
              </Field>
            )}
            <Field label="이메일">
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="professor@university.ac.kr"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={inp} />
            </Field>
            <Field label="비밀번호">
              <input type="password" value={form.password} onChange={set('password')}
                placeholder={mode === 'register' ? '8자 이상, 영문+숫자 포함' : '비밀번호'}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={inp} />
            </Field>
          </div>

          {error && (
            <p className="mt-4 text-[13px] text-red-500">· {error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1a6d7e] text-sm font-bold text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:opacity-60"
          >
            {loading
              ? <><Spin /> 처리 중...</>
              : mode === 'login' ? '로그인' : '가입하기'}
          </button>

          {/* 모드 전환 */}
          <p className="mt-5 text-center text-[13px] text-slate-400">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-semibold text-[#1a6d7e] hover:underline"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
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
