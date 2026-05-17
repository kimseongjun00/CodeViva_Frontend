import React from 'react';

const GlobalNav = () => {
  return (
    <nav className="mb-0 flex justify-center gap-[2px] border-x border-[#cfcfcf] bg-white px-4 pb-0">
      <button className="w-[220px] border border-[#bdbdbd] bg-[#8f8f8f] py-[6px] text-[14px] font-bold text-white">교육현황</button>
      <button className="w-[220px] border border-[#bdbdbd] bg-[#9e9e9e] py-[6px] text-[14px] font-bold text-white">커뮤니티</button>
      <button className="w-[220px] border border-[#bdbdbd] bg-[#9e9e9e] py-[6px] text-[14px] font-bold text-white">소개</button>
    </nav>
  );
};

export default GlobalNav;
