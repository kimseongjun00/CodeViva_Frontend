import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const CredentialLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const { token } = await login({ email, password });
      const me = await loginWithToken(token);
      // TEACHER/ADMIN → 강사 목록, STUDENT → 학생 목록
      navigate(me.role === 'STUDENT' ? '/student/assignment-list' : '/instructor/assignment-list');
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f3f3f1] pt-[200px] font-['Dotum','Apple_SD_Gothic_Neo',sans-serif]">
      <div className="w-[520px] border-[4px] border-[#a58d6f] bg-white px-6 pt-8 pb-6 shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
        <h2 className="border-b border-[#d8d8d8] pb-2 text-[44px] leading-none font-serif text-[#2d2d2d]">e-Class LOGIN</h2>
        <div className="mt-9 flex gap-3">
          <div className="flex-1">
            <input
              className="mb-2 h-8 w-full border border-[#d6d6d6] px-2 text-[12px] text-[#555]"
              placeholder="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input
              className="h-8 w-full border border-[#d6d6d6] bg-[#ecf4ff] px-2 text-[12px]"
              placeholder="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex h-[68px] w-[96px] items-center justify-center bg-gradient-to-b from-[#2d5c90] to-[#0c2f59] text-[24px] font-bold text-white disabled:opacity-60"
          >
            {loading ? '...' : 'LOGIN'}
          </button>
        </div>
        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#4f4f4f]">
          <button className="hover:underline">비밀번호 찾기</button>
          <button className="hover:underline">아이디 찾기(학번)</button>
          <Link to="/register" className="font-bold text-[#2d5c90] hover:underline">
            회원가입
          </Link>
        </div>
        <div className="mt-6 border border-[#9dd6ec] bg-[#f5fdff] px-4 py-3">
          <div className="flex gap-3">
            <div className="flex w-[86px] shrink-0 flex-col items-center justify-center border-r border-[#b9dce7] pr-2 text-[#0b8fb1]">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#8ccddd] text-[22px] leading-none text-white">?</div>
              <div className="text-[22px] leading-none font-bold">ID 문의</div>
            </div>
            <div className="space-y-0.5 pt-1 text-[11px] text-[#3f3f3f]">
              <div>▸ 학부생/대학원생/졸업생 : 원스톱서비스센터</div>
              <div>▸ 교원 : 강범호 교수학습센터</div>
              <div>▸ 강사 : 학사종합지원센터(해당단과대학) 및 각 대학원</div>
              <div>▸ 직원 : 인사팀</div>
              <div className="pt-2 text-[10px] text-[#6e6e6e]">
                <Link to="/login" className="hover:underline">
                  통합로그인 선택 화면으로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialLoginPage;
