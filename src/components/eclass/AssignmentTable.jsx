import React from 'react';
import { Link } from 'react-router-dom';

const AssignmentTable = ({ role }) => {
  const isInstructor = role === 'instructor';
  const assignmentPath = isInstructor ? '/instructor/assignment-detail' : '/student/assignment-submit';

  return (
    <div>
      <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
        <h2 className="text-[30px] leading-none font-bold text-[#5a5a5a]">과제</h2>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
          <span>›</span>
          <span>게임프로그래밍</span>
          <span>›</span>
          <span className="font-bold text-[#1a6d7e]">과제</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          <Link to="/student/assignment-list" className={`border px-3 py-1 text-xs ${!isInstructor ? 'border-[#2b7c8e] bg-[#2b7c8e] text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
            학생 과제 리스트
          </Link>
          <Link to="/instructor/assignment-list" className={`border px-3 py-1 text-xs ${isInstructor ? 'border-[#2b7c8e] bg-[#2b7c8e] text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
            교수 과제 리스트
          </Link>
        </div>
        {isInstructor && <Link to="/instructor/assignment-create" className="bg-[#4d4d4d] px-4 py-1 text-xs font-bold text-white">과제 출제</Link>}
      </div>

      <div className="mb-4 flex justify-center">
        <div className="flex w-[360px]">
          <input type="text" placeholder="검색" className="w-full border border-gray-300 px-3 py-1 text-xs focus:border-gray-500 focus:outline-none" />
          <button className="bg-[#555] px-5 py-1 text-xs font-bold text-white">search</button>
        </div>
      </div>

      <table className="w-full border border-[#d3d3d3] text-center text-[11px]">
        <thead className="bg-[#7f7f7f] text-white">
          <tr>
            <th className="w-12 py-1.5 font-normal">번호</th>
            <th className="w-12 py-1.5 font-normal">중요</th>
            <th className="px-4 py-1.5 text-left font-normal">제목</th>
            <th className="w-20 py-1.5 font-normal">진행</th>
            <th className="w-16 py-1.5 font-normal">제출</th>
            <th className="w-16 py-1.5 font-normal">점수</th>
            <th className="w-16 py-1.5 font-normal">배점</th>
            <th className="w-36 py-1.5 font-normal">마감일</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          <tr className="border-b border-[#e2e2e2] hover:bg-gray-50">
            <td className="py-2.5 text-xs">1</td>
            <td className="py-2.5 text-gray-300">★</td>
            <td className="px-4 py-2.5 text-left">
              <Link to={assignmentPath} className="font-semibold text-[#1a6d7e] hover:underline">게임 기획서 제출</Link>
              <div className="mt-1 text-xs text-gray-500">온라인</div>
            </td>
            <td className="py-2.5 text-xs text-green-600">진행중</td>
            <td className="py-2.5"><Link to={assignmentPath} className="font-bold text-red-500 hover:underline">X</Link></td>
            <td className="py-2.5 text-xs text-gray-500">비공개</td>
            <td className="py-2.5 text-xs text-gray-500">비공개</td>
            <td className="py-2.5 text-xs text-gray-600">2026.04.06 오전 10:00</td>
          </tr>
          <tr className="border-b border-[#e2e2e2] hover:bg-gray-50">
            <td className="py-2.5 text-xs">2</td>
            <td className="py-2.5 text-gray-300">★</td>
            <td className="px-4 py-2.5 text-left">
              <Link to={assignmentPath} className="font-semibold text-[#1a6d7e] hover:underline">정렬 알고리즘 구현</Link>
              <div className="mt-1 text-xs text-gray-500">코드</div>
            </td>
            <td className="py-2.5 text-xs text-green-600">진행중</td>
            <td className="py-2.5"><Link to={assignmentPath} className="font-bold text-[#1a6d7e] hover:underline">O</Link></td>
            <td className="py-2.5 text-xs text-gray-500">87</td>
            <td className="py-2.5 text-xs text-gray-500">100</td>
            <td className="py-2.5 text-xs text-gray-600">2026.04.09 오후 11:59</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentTable;
