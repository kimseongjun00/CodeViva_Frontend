import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!name.trim()) return '이름을 입력해주세요.';
    if (!studentId.trim()) return '학번을 입력해주세요.';
    if (!/^\d{6,12}$/.test(studentId.trim())) return '학번은 숫자 6~12자리로 입력해주세요.';
    if (!password) return '비밀번호를 입력해주세요.';
    if (password.length < 6) return '비밀번호는 6자 이상이어야 합니다.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    const email = `${studentId.trim()}@codeviva.kr`;
    try {
      const { token } = await register({ name, email, password });
      const me = await loginWithToken(token);
      navigate(me.role === 'STUDENT' ? '/student/assignment-list' : '/instructor/assignment-list');
    } catch (err) {
      const status = err?.message;
      if (status === '409') {
        setError('이미 등록된 학번입니다. 로그인해주세요.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f3f3f1] pt-[140px] font-['Dotum','Apple_SD_Gothic_Neo',sans-serif]">
      <div className="w-[520px] border-[4px] border-[#a58d6f] bg-white px-6 pt-8 pb-6 shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
        {/* 헤더 */}
        <h2 className="border-b border-[#d8d8d8] pb-2 text-[44px] leading-none font-serif text-[#2d2d2d]">
          e-Class JOIN
        </h2>

        {/* 안내 문구 */}
        <p className="mt-4 text-[11px] leading-5 text-[#666666]">
          e-Class 통합 계정을 생성합니다. 이메일과 비밀번호를 입력해주세요.
        </p>

        {/* 폼 */}
        <div className="mt-5 space-y-2">
          {/* 이름 */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#555]">이름</label>
            <input
              className="h-8 w-full border border-[#d6d6d6] px-2 text-[12px] text-[#555] focus:border-[#a58d6f] focus:outline-none"
              placeholder="홍길동"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* 학번 */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#555]">학번</label>
            <input
              className="h-8 w-full border border-[#d6d6d6] px-2 text-[12px] text-[#555] focus:border-[#a58d6f] focus:outline-none"
              placeholder="20230001"
              type="text"
              inputMode="numeric"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {studentId && (
              <p className="mt-0.5 text-[10px] text-[#6e6e6e]">로그인 ID: {studentId}@codeviva.kr</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#555]">비밀번호</label>
            <input
              className="h-8 w-full border border-[#d6d6d6] bg-[#ecf4ff] px-2 text-[12px] focus:border-[#a58d6f] focus:outline-none"
              placeholder="6자 이상"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#555]">비밀번호 확인</label>
            <input
              className={`h-8 w-full border px-2 text-[12px] focus:outline-none ${
                passwordConfirm && password !== passwordConfirm
                  ? 'border-red-400 bg-red-50'
                  : 'border-[#d6d6d6] bg-[#ecf4ff] focus:border-[#a58d6f]'
              }`}
              placeholder="비밀번호를 다시 입력해주세요"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="mt-0.5 text-[10px] text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 flex h-10 w-full items-center justify-center bg-gradient-to-b from-[#2d5c90] to-[#0c2f59] text-[13px] font-bold text-white disabled:opacity-60"
        >
          {loading ? '처리 중...' : '회원가입'}
        </button>

        {/* 하단 링크 */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#4f4f4f]">
          <span>이미 계정이 있으신가요?</span>
          <Link
            to="/login/credentials"
            className="font-bold text-[#2d5c90] hover:underline"
          >
            로그인
          </Link>
        </div>

        {/* 안내 박스 */}
        <div className="mt-5 border border-[#9dd6ec] bg-[#f5fdff] px-4 py-3">
          <div className="flex gap-3">
            <div className="flex w-[86px] shrink-0 flex-col items-center justify-center border-r border-[#b9dce7] pr-2 text-[#0b8fb1]">
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#8ccddd] text-[22px] leading-none text-white">
                !
              </div>
              <div className="text-[12px] leading-none font-bold">안내</div>
            </div>
            <div className="space-y-0.5 pt-1 text-[11px] text-[#3f3f3f]">
              <div>▸ 회원가입 후 기본 역할은 <strong>학생(STUDENT)</strong>으로 설정됩니다.</div>
              <div>▸ 교수/강사 권한은 관리자에게 별도 문의하세요.</div>
              <div>▸ 과목 수강은 교수가 직접 등록해드립니다.</div>
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

export default RegisterPage;
