import React from 'react';

const GlobalNav = () => {
  return (
    <nav className="mb-0 flex justify-center gap-[2px] border-x border-[#cfcfcf] bg-white px-4 pb-0">
      <button className="w-[150px] border border-[#d0d0d0] bg-[#c8c8c8] py-[5px] text-[12px] font-bold text-white">교육현황</button>
      <button className="w-[150px] border border-[#d0d0d0] bg-[#c8c8c8] py-[5px] text-[12px] font-bold text-white">커뮤니티</button>
      <button className="w-[150px] border border-[#d0d0d0] bg-[#c8c8c8] py-[5px] text-[12px] font-bold text-white">소개</button>
    </nav>
  );
};

export default GlobalNav;
