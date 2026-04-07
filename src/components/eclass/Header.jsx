import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ messageCount, checkCount, bellCount }) => {
  return (
    <header
      className="relative flex h-[128px] items-end justify-between overflow-visible border-x border-t border-[#cfcfcf] bg-white px-6 pt-5 pb-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
      style={{ borderTopLeftRadius: '56% 48px', borderTopRightRadius: '56% 48px' }}
    >
        <div className="mb-2">
          <select className="rounded-sm border border-[#a5a5a5] bg-[#686868] px-2 py-[2px] text-[11px] text-white">
            <option>한국어</option>
          </select>
        </div>

        <div className="pointer-events-none absolute top-0 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center text-center">
          <div className="-mt-6 mb-1 flex h-[78px] w-[78px] items-center justify-center rounded-full border border-[#cfd6d8] bg-white shadow-sm">
            <span className="text-[27px] font-bold text-[#1a9bb4]">HUFS</span>
          </div>
          <h1 className="text-[18px] leading-5 font-bold tracking-wide text-[#00a0cf]">한국외국어대학교</h1>
          <p className="text-[11px] font-bold text-[#00a0cf]">e-Class (LMS / TMS)</p>
        </div>

        <div className="mb-2 flex items-center gap-2 font-['Dotum','Apple_SD_Gothic_Neo',sans-serif] text-[11px]">
          <div className="border border-[#c8c8c8] bg-white px-[8px] py-[5px]">
            <Link to="/student/assignment-list" className="font-bold text-[#1a6d7e] hover:underline">
              김성준
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <button className="relative" aria-label="쪽지">
              ✉️
              <span className="absolute -top-1 -right-2 rounded-full bg-[#1a6d7e] px-1 text-[10px] text-white">{messageCount}</span>
            </button>
            <button className="relative" aria-label="확인 알림">
              ☑️
              <span className="absolute -top-1 -right-2 rounded-full bg-[#1a6d7e] px-1 text-[10px] text-white">{checkCount}</span>
            </button>
            <button className="relative" aria-label="종합 알림">
              🔔
              <span className="absolute -top-1 -right-2 rounded-full bg-[#1a6d7e] px-1 text-[10px] text-white">{bellCount}</span>
            </button>
          </div>
          <Link
            to="/login"
            className="border border-[#c8c8c8] bg-[#f7f7f7] px-[6px] py-[4px] text-[#666666] hover:border-[#999] hover:bg-white"
          >
            로그아웃
          </Link>
        </div>
    </header>
  );
};

export default Header;
