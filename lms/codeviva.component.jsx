import React from 'react';

const EClassClone = () => {
  return (
    <div className="min-h-screen bg-[#d9dcdb] font-sans flex flex-col items-center">
      <div className="w-full h-32 bg-[#555] absolute top-0 left-0 z-0 shadow-inner"></div>
      <div className="relative z-10 w-[980px] mt-8 bg-transparent">
        <header className="flex justify-between items-end mb-4 bg-white rounded-t-xl px-6 pt-4 pb-2 shadow-sm">
          <div className="mb-2">
            <select className="bg-gray-700 text-white text-xs px-2 py-1 rounded">
              <option>한국어</option>
            </select>
          </div>
          <div className="flex flex-col items-center -mt-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 mb-1">
              <span className="text-teal-700 font-bold text-3xl">HUFS</span>
            </div>
            <h1 className="text-[#1a6d7e] font-bold text-lg tracking-wide">한국외국어대학교</h1>
            <p className="text-[#1a6d7e] text-xs font-semibold">e-Class (LMS/TMS)</p>
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center space-x-1 border border-gray-300 px-2 py-1 rounded bg-gray-50">
              <div className="w-5 h-5 bg-gray-300 rounded overflow-hidden">
                <img src="/api/placeholder/20/20" alt="profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-[#1a6d7e]">김성준</span>
            </div>
            <div className="flex space-x-2 text-gray-500 text-sm">
              <button>✉️</button>
              <button className="relative">
                ☑️<span className="absolute -top-1 -right-2 bg-[#1a6d7e] text-white text-[10px] px-1 rounded-full">4</span>
              </button>
              <button className="relative">
                🔔<span className="absolute -top-1 -right-2 bg-[#1a6d7e] text-white text-[10px] px-1 rounded-full">6</span>
              </button>
            </div>
            <button className="text-xs border border-gray-400 px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
              로그아웃
            </button>
          </div>
        </header>

        <nav className="flex space-x-1 mb-2">
          <button className="bg-[#a5a5a5] text-white w-1/3 py-2 text-sm font-bold shadow-sm">교육현황</button>
          <button className="bg-[#b5b5b5] text-white w-1/3 py-2 text-sm font-bold shadow-sm">커뮤니티</button>
          <button className="bg-[#b5b5b5] text-white w-1/3 py-2 text-sm font-bold shadow-sm">소개</button>
        </nav>

        <div className="flex bg-[#fcfcfc] rounded-b-xl shadow-lg border border-gray-300 min-h-[600px] mb-8">
          <aside className="w-[230px] p-4 border-r border-gray-200">
            <div className="border-[3px] border-gray-300 rounded-md bg-white overflow-hidden mb-4">
              <div className="bg-[#f0f4f5] text-[#1a6d7e] text-center py-2 font-bold text-sm border-b border-gray-300">
                수강과목
              </div>
              <div className="p-3">
                <div className="text-center text-xs text-[#1a6d7e] font-bold mb-2">2026-1학기</div>
                <select className="w-full text-xs border border-gray-400 p-1 mb-1">
                  <option>[글로벌]게임프로그래...</option>
                </select>
                <div className="text-[11px] text-gray-600 mb-3 text-center border-b border-gray-200 pb-2">
                  월 34수 5(5309)
                </div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 강의계획서</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 온라인강의</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 공지사항</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 질의응답</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center justify-between">
                    <div className="flex items-center"><span className="mr-2 text-[8px]">▶</span> 강의자료</div>
                    <span className="text-[#1a6d7e] font-bold">2</span>
                  </li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 출석</li>
                  <li className="px-2 py-1.5 bg-[#2b7c8e] text-white cursor-pointer flex items-center font-bold"><span className="mr-2 text-[8px]">▶</span> 과제</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 팀프로젝트</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 시험</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 토론</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 투표</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 설문</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 성적</li>
                  <li className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer flex items-center"><span className="mr-2 text-[8px]">▶</span> 이의신청</li>
                </ul>
              </div>
            </div>
            <div className="border-[3px] border-gray-300 rounded-md bg-white overflow-hidden">
              <div className="p-3 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center">
                <span className="mr-2 text-[8px]">▶</span> 열린게시판
              </div>
            </div>
          </aside>

          <main className="flex-1 p-8 bg-white">
            <div className="flex justify-between items-end border-b-2 border-[#1a6d7e] pb-3 mb-6">
              <h2 className="text-xl font-bold text-gray-800">과제</h2>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span className="bg-[#1a6d7e] text-white px-1 text-[10px] rounded-sm">H</span>
                <span>›</span>
                <span>게임프로그래밍</span>
                <span>›</span>
                <span className="text-[#1a6d7e] font-bold">과제</span>
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="flex w-[400px]">
                <input type="text" placeholder="검색" className="w-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500" />
                <button className="bg-[#555] text-white px-6 py-1.5 text-sm font-bold">search</button>
              </div>
            </div>
            <table className="w-full text-center border-t-2 border-gray-500 text-sm">
              <thead className="bg-[#888] text-white">
                <tr>
                  <th className="py-2.5 font-normal w-12">번호</th>
                  <th className="py-2.5 font-normal w-12">중요</th>
                  <th className="py-2.5 font-normal text-left px-4">제목</th>
                  <th className="py-2.5 font-normal w-20">진행</th>
                  <th className="py-2.5 font-normal w-16">제출</th>
                  <th className="py-2.5 font-normal w-16">점수</th>
                  <th className="py-2.5 font-normal w-16">배점</th>
                  <th className="py-2.5 font-normal w-36">마감일</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 text-xs">1</td>
                  <td className="py-4 text-gray-300">★</td>
                  <td className="py-4 text-left px-4">
                    <div className="font-semibold text-gray-800">게임 기획서 제출</div>
                    <div className="text-xs text-gray-500 mt-1">온라인</div>
                  </td>
                  <td className="py-4 text-green-600 text-xs">진행중</td>
                  <td className="py-4 text-red-500 font-bold">X</td>
                  <td className="py-4 text-xs text-gray-500">비공개</td>
                  <td className="py-4 text-xs text-gray-500">비공개</td>
                  <td className="py-4 text-xs text-gray-600">2026.04.06 오전 10:00</td>
                </tr>
              </tbody>
            </table>
          </main>
        </div>
      </div>

      <footer className="w-full bg-[#525252] text-gray-300 py-8 text-xs flex justify-center pb-12 rounded-b-[40px]">
        <div className="w-[980px] flex justify-between">
          <div className="flex items-start space-x-6">
            <div className="w-32 text-white font-bold text-xl flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-[10px]">HUFS</div>
              <span>한국외국어대학교</span>
            </div>
            <div className="space-y-1.5 text-gray-400">
              <p>COPYRIGHT 2012 Hankuk Univ of Foreign Studies</p>
              <p>서울캠퍼스 (02450) 서울시 동대문구 이문로 107</p>
              <p>글로벌캠퍼스 (17035) 경기도 용인시 처인구 모현읍 외대로 81</p>
              <p>e-Class문의 : 02-2173-2226 | 이러닝 강좌 문의 : 02-2173-2252</p>
              <p className="font-bold text-white mt-2 cursor-pointer hover:underline">개인정보처리방침</p>
            </div>
          </div>
          <div className="flex space-x-12 pr-4 text-gray-200">
            <div>
              <h4 className="font-bold mb-3">교육현황</h4>
              <ul className="space-y-1.5 text-gray-400">
                <li>개설과목검색</li>
                <li>OCW</li>
                <li>학사일정</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">커뮤니티</h4>
              <ul className="space-y-1.5 text-gray-400">
                <li>공지사항</li>
                <li>질의응답</li>
                <li>자료실</li>
                <li>소모임</li>
                <li>설문</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">소개</h4>
              <ul className="space-y-1.5 text-gray-400">
                <li>소개</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">마이페이지</h4>
              <ul className="space-y-1.5 text-gray-400">
                <li>개인정보</li>
                <li>수강과목</li>
                <li>올린파일함</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EClassClone;
