import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Footer from '../components/eclass/Footer';

const LoginSidebar = () => {
  return (
    <aside className="w-[190px] shrink-0 px-3 pb-3">
      <div className="-mt-5 mb-3 overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-white">
        <div className="border-b border-[#cfcfcf] bg-[#f3f6f7] py-2 text-center text-sm font-bold text-[#1a6d7e]">회원</div>
        <div className="p-2">
          <div className="bg-[#2b7c8e] px-2 py-1 text-[11px] font-bold text-white">▶ 로그인</div>
        </div>
      </div>
    </aside>
  );
};

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-36 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-[980px] pt-7">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<LoginSidebar />}>
          <div>
            <div className="mb-3 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[30px] leading-none font-bold text-[#5a5a5a]">로그인</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">로그인</span>
              </div>
            </div>

            <div className="flex min-h-[340px] items-center justify-center">
              <div className="flex w-full max-w-[640px] items-center justify-between gap-8">
                <div className="pl-2">
                  <div className="text-[56px] leading-[48px] font-black tracking-tight text-[#2b2f37]">MEMBER</div>
                  <div className="text-[56px] leading-[48px] font-black tracking-tight text-[#2a8aa3]">LOGIN</div>
                </div>
                <div className="w-[320px] border border-[#d6d6d6] bg-white">
                  <div className="flex border-b border-[#d6d6d6] text-[11px]">
                    <button className="flex-1 bg-[#2f5188] py-2.5 font-bold text-white">통합로그인 서비스</button>
                    <button className="flex-1 bg-white py-2.5 text-gray-600">일반 로그인</button>
                  </div>
                  <div className="border-b border-[#ececec] px-4 py-6 text-center text-[11px] leading-5 text-gray-700">
                    학생, 교원(교수) 및 교직원은
                    <br />
                    통합로그인 서비스를 클릭해주세요.
                  </div>
                  <div className="px-4 py-4">
                    <Link to="/login/credentials" className="block bg-[#082f63] py-2.5 text-center text-[11px] font-bold text-white">
                      통합로그인 서비스
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
