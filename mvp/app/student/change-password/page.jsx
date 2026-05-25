'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changeStudentPassword } from '../../../lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cv_student_token');
    const userData = localStorage.getItem('cv_student_user');
    if (!token || !userData) { router.push('/student'); return; }
    setUser(JSON.parse(userData));
  }, [router]);

  const validate = () => {
    if (!newPw) return '새 비밀번호를 입력해주세요.';
    if (newPw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/[a-zA-Z]/.test(newPw)) return '영문자를 포함해야 합니다.';
    if (!/[0-9]/.test(newPw)) return '숫자를 포함해야 합니다.';
    if (newPw !== confirmPw) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    const studentId = (user?.email ?? '').replace('@codeviva.kr', '');
    try {
      await changeStudentPassword({ currentPassword: studentId, newPassword: newPw });
      router.push('/student/dashboard');
    } catch (e) {
      const s = e?.message;
      if (s === '400') setError('현재 비밀번호가 올바르지 않습니다.');
      else setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-14">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-[17px] font-extrabold tracking-tight text-slate-900">
          Code<span className="text-[#1a6d7e]">Viva</span>
        </div>

        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
          초기 비밀번호 변경 필요
        </span>
        <h1 className="mt-2 text-[22px] font-bold tracking-tight text-slate-900">비밀번호 변경</h1>
        <p className="mt-1 text-[13px] text-slate-400">
          보안을 위해 초기 비밀번호를 변경해주세요.
        </p>

        <div className="mt-7 space-y-4">
          <Field label="새 비밀번호">
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="8자 이상, 영문+숫자 포함"
              className={inp}
            />
          </Field>
          <Field label="새 비밀번호 확인">
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="비밀번호 재입력"
              className={inp}
            />
          </Field>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-500">· {error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1a6d7e] text-sm font-bold text-white transition hover:bg-teal-800 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? <><Spin /> 변경 중...</> : '비밀번호 변경 후 시작하기'}
        </button>
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
