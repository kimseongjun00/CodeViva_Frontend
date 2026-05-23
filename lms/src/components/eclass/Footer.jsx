import React from 'react';

const Footer = () => {
  return (
    <footer
      className="border-x border-b border-[#5a5a5a] bg-[#565656] px-6 py-9 text-[11px] text-[#cfcfcf] shadow-[0_-1px_0_rgba(255,255,255,0.08)_inset]"
      style={{ borderBottomLeftRadius: '62% 40px', borderBottomRightRadius: '62% 40px' }}
    >
      <div className="flex justify-between gap-8">
        <div>
          <div className="mb-2 text-sm font-bold text-white">한국외국어대학교</div>
          <div className="space-y-1 leading-4 text-[#c4c4c4]">
            <p>COPYRIGHT 2012 Hankuk Univ of Foreign Studies</p>
            <p>서울캠퍼스 (02450) 서울시 동대문구 이문로 107</p>
            <p>글로벌캠퍼스 (17035) 경기도 용인시 처인구 모현읍 외대로 81</p>
            <p>e-Class문의 : 02-2173-2226 | 이러닝 강좌 문의 : 02-2173-2252</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-7 text-[#c2c2c2]">
          <div>
            <div className="mb-2 font-bold text-[#e5e5e5]">교육현황</div>
            <ul className="space-y-1">
              <li>개설과목검색</li>
              <li>OCW</li>
              <li>학사일정</li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-bold text-[#e5e5e5]">커뮤니티</div>
            <ul className="space-y-1">
              <li>공지사항</li>
              <li>질의응답</li>
              <li>자료실</li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-bold text-[#e5e5e5]">소개</div>
            <ul className="space-y-1">
              <li>이용안내</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-bold text-[#e5e5e5]">마이페이지</div>
            <ul className="space-y-1">
              <li>내 정보</li>
              <li>알림설정</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
