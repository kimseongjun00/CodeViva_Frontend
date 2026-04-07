import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ currentPath }) => {
  const menus = [
    { path: '/student/assignment-list', label: '과제 리스트(학생)' },
    { path: '/instructor/assignment-list', label: '과제 리스트(교수)' },
  ];

  return (
    <aside className="w-[190px] shrink-0 px-3 pb-3">
      <div className="-mt-5 mb-3 overflow-hidden rounded-[4px] border-[3px] border-[#d2d2d2] bg-white">
        <div className="border-b border-[#cfcfcf] bg-[#f3f6f7] py-2 text-center text-sm font-bold text-[#1a6d7e]">수강과목</div>
        <div className="p-3">
          <div className="mb-2 text-center text-xs font-bold text-[#1a6d7e]">2026-1학기</div>
          <select className="mb-1 w-full border border-gray-400 p-1 text-[11px]">
            <option>[글로벌]게임프로그래밍</option>
          </select>
          <div className="mb-3 border-b border-gray-200 pb-2 text-center text-[10px] text-gray-600">월 34수 5(5309)</div>
          <ul className="space-y-[2px] text-[11px] text-gray-700">
            {['강의계획서', '온라인강의', '공지사항', '질의응답', '강의자료', '출석'].map((menu) => (
              <li key={menu} className="flex cursor-pointer items-center px-2 py-1 hover:bg-gray-100">
                <span className="mr-1.5 text-[7px]">▶</span>
                {menu}
              </li>
            ))}
            <li className="flex items-center bg-[#2b7c8e] px-2 py-1 font-bold text-white">
              <span className="mr-1.5 text-[7px]">▶</span> 과제
            </li>
            <div className="space-y-1 pl-4">
              {menus.map((menu) => (
                <Link
                  key={menu.path}
                  to={menu.path}
                  className={`block rounded-sm px-2 py-1 text-[10px] ${
                    currentPath === menu.path ? 'bg-[#d9eaee] font-bold text-[#1a6d7e]' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {menu.label}
                </Link>
              ))}
            </div>
            {['팀프로젝트', '시험', '토론', '투표', '설문', '성적', '이의신청'].map((menu) => (
              <li key={menu} className="flex cursor-pointer items-center px-2 py-1 hover:bg-gray-100">
                <span className="mr-1.5 text-[7px]">▶</span>
                {menu}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
