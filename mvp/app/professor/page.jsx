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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let token;
      if (mode === 'login') {
        const res = await login({ email: form.email, password: form.password });
        token = res.token;
      } else {
        if (!form.name.trim()) { setError('이름을 입력해주세요.'); return; }
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-100 bg-white px-8 py-5">
        <a href="/" className="text-xl font-extrabold tracking-tight text-slate-900">
          Code<span className="text-[#1a6d7e]">Viva</span>
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">교수자 포털</h1>
          <p className="mb-8 text-sm text-slate-500">
            {mode === 'login' ? '계정에 로그인하세요.' : '새 교수자 계정을 만드세요.'}
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            {/* 탭 */}
            <div className="mb-6 flex rounded-lg border border-slate-200 p-1">
              {[['login', '로그인'], ['register', '회원가입']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    mode === m
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">이름</label>
                  <input value={form.name} onChange={set('name')} placeholder="홍길동"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1a6d7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6d7e]/20" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">이메일</label>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="professor@university.ac.kr"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1a6d7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6d7e]/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">비밀번호</label>
                <input type="password" value={form.password} onChange={set('password')}
                  placeholder="6자 이상"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1a6d7e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a6d7e]/20" />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="mt-5 w-full rounded-xl bg-[#1a6d7e] py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60">
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
