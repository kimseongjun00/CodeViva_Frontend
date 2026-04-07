import React from 'react';
import { Link } from 'react-router-dom';

const CredentialLoginPage = () => {
  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f3f3f1] pt-[200px] font-['Dotum','Apple_SD_Gothic_Neo',sans-serif]">
      <div className="w-[520px] border-[4px] border-[#a58d6f] bg-white px-6 pt-8 pb-6 shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
        <h2 className="border-b border-[#d8d8d8] pb-2 text-[44px] leading-none font-serif text-[#2d2d2d]">e-Class LOGIN</h2>
        <div className="mt-9 flex gap-3">
          <div className="flex-1">
            <input
              className="mb-2 h-8 w-full border border-[#d6d6d6] px-2 text-[12px] text-[#555]"
              defaultValue="202304679"
            />
            <input className="h-8 w-full border border-[#d6d6d6] bg-[#ecf4ff] px-2 text-[12px]" defaultValue="•••••••••" type="password" />
          </div>
          <Link
            to="/student/assignment-list"
            className="flex h-[68px] w-[96px] items-center justify-center bg-gradient-to-b from-[#2d5c90] to-[#0c2f59] text-[24px] font-bold text-white"
          >
            LOGIN
          </Link>
        </div>
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#4f4f4f]">
          <label className="flex items-center gap-1">
            <input type="checkbox" defaultChecked className="h-3 w-3" />
            아이디저장
          </label>
          <button className="hover:underline">비밀번호 찾기</button>
          <button className="hover:underline">아이디 찾기(학번)</button>
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
