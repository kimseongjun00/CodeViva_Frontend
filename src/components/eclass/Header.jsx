import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ messageCount, checkCount, bellCount }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
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
          <div className="-mt-10 -mb-9 flex h-[140px] w-[140px] items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white">
            <img src="/hufs_logo.png" alt="한국외국어대학교 로고" className="h-[100px] w-[100px] -mt-5 object-contain p-1.5" />
          </div>
          <h1 className="mt-2 text-[25px] leading-tight font-black tracking-[0.15em] text-[#00a0cf]">한국외국어대학교</h1>
          <p className="-mt-2 text-[19px] font-bold tracking-[0.02em] text-[#00a0cf]">e-Class (LMS/TMS)</p>
        </div>

        <div className="mb-2 flex items-center gap-2 font-['Dotum','Apple_SD_Gothic_Neo',sans-serif] text-[11px]">
          <div className="border border-[#c8c8c8] bg-white px-[8px] py-[5px]">
            <span className="font-bold text-[#1a6d7e]">
              {user?.name ?? ''}
            </span>
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
          <button
            onClick={handleLogout}
            className="border border-[#c8c8c8] bg-[#f7f7f7] px-[6px] py-[4px] text-[#666666] hover:border-[#999] hover:bg-white"
          >
            로그아웃
          </button>
        </div>
    </header>
  );
};

export default Header;
