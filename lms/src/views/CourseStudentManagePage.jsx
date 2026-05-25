import React, { useEffect, useState, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { registerStudentGetId, getAllUsers } from '../api/auth';
import { getCourseUsers, createCourseUser, enrollStudentsBulk, deleteCourseUser } from '../api/courseUsers';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import Footer from '../components/eclass/Footer';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import * as XLSX from 'xlsx';
import Pagination from '../components/eclass/Pagination';

const PAGE_SIZE = 10;

const CourseStudentManagePage = () => {
  const { user } = useAuth();
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();
  const fileInputId = useId();

  const [students, setStudents] = useState([]);
  const [emailMap, setEmailMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 개별 추가
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [singleMsg, setSingleMsg] = useState({ type: '', text: '' });

  // 엑셀 일괄 등록
  const [bulkRows, setBulkRows] = useState(null);
  const [bulkParseError, setBulkParseError] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);

  // 삭제
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    if (!selectedCourse?.id) return;
    setLoading(true);
    try {
      const [list, allUsers] = await Promise.all([
        getCourseUsers(selectedCourse.id),
        getAllUsers().catch(() => []),
      ]);
      const map = {};
      (allUsers ?? []).forEach((u) => {
        if (u.email?.endsWith('@codeviva.kr')) {
          map[u.id] = u.email.replace('@codeviva.kr', '');
        }
      });
      setEmailMap(map);
      setStudents(list.filter((u) => u.courseRole === 'STUDENT'));
    } catch {
      setError('학생 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse?.id]);

  useEffect(() => { load(); }, [load]);

  const registerStudentOnly = async ({ studentId: sid, name: n }) => {
    const { id: userId } = await registerStudentGetId({ studentId: sid.trim(), name: n.trim() });
    return Number(userId);
  };

  const enrollOne = async (userId) => {
    try {
      await createCourseUser({ courseId: Number(selectedCourse.id), userId, courseRole: 'STUDENT' });
    } catch (e) {
      if (e?.message !== '500' && e?.message !== '409') throw e;
    }
  };

  const handleAdd = async () => {
    if (!studentId.trim() || !name.trim()) { setSingleMsg({ type: 'error', text: '학번과 이름을 입력해주세요.' }); return; }
    setAdding(true); setSingleMsg({ type: '', text: '' });
    try {
      const userId = await registerStudentOnly({ studentId, name });
      await enrollOne(userId);
      setSingleMsg({ type: 'ok', text: `${name} 학생이 등록되었습니다.` });
      setStudentId(''); setName('');
      await load();
    } catch (e) {
      setSingleMsg({ type: 'error', text: e?.message === '401' ? '세션이 만료됐습니다.' : (e?.message ?? '오류가 발생했습니다.') });
    } finally {
      setAdding(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkParseError(''); setBulkRows(null); setBulkResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const idKey = Object.keys(raw[0] ?? {}).find((k) => /학번|학생번호|studentid|id/i.test(k));
        const nameKey = Object.keys(raw[0] ?? {}).find((k) => /이름|성명|name/i.test(k));
        if (!idKey || !nameKey) { setBulkParseError('"학번"과 "이름" 열이 필요합니다.'); return; }
        const rows = raw
          .map((r) => ({ studentId: String(r[idKey]).trim(), name: String(r[nameKey]).trim() }))
          .filter((r) => r.studentId && r.name);
        if (!rows.length) { setBulkParseError('유효한 데이터가 없습니다.'); return; }
        setBulkRows(rows);
      } catch {
        setBulkParseError('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleBulkRegister = async () => {
    if (!bulkRows?.length) return;
    setBulkProgress({ done: 0, total: bulkRows.length, phase: 'account' });
    setBulkResults(null);
    const ok = [], fail = [];
    const userIds = [];

    // 1단계: 계정 생성 (순차)
    for (let i = 0; i < bulkRows.length; i++) {
      try {
        const userId = await registerStudentOnly(bulkRows[i]);
        userIds.push(userId);
        ok.push(bulkRows[i]);
      } catch (e) {
        fail.push({ ...bulkRows[i], reason: e?.message ?? '오류' });
      }
      setBulkProgress({ done: i + 1, total: bulkRows.length, phase: 'account' });
    }

    // 2단계: 수강 등록 bulk 한 번에
    if (userIds.length > 0) {
      setBulkProgress({ done: userIds.length, total: userIds.length, phase: 'enroll' });
      try {
        await enrollStudentsBulk({ courseId: Number(selectedCourse.id), studentIds: userIds });
      } catch (e) {
        fail.push(...ok.splice(0));
      }
    }

    setBulkResults({ ok, fail });
    setBulkRows(null);
    await load();
  };

  const handleDelete = async (cu) => {
    if (!window.confirm(`${cu.userName} 학생을 수강 취소하시겠습니까?`)) return;
    setDeleting(cu.id);
    try {
      await deleteCourseUser(cu.id);
      await load();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath="/instructor/manage-students" />}>
          <div>
            <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">수강생 관리</h2>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
                <span>›</span>
                <span>{selectedCourse?.name || '과목 미선택'}</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">수강생 관리</span>
              </div>
            </div>

            {!selectedCourse && (
              <div className="mb-4 border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-600">
                과목이 선택되지 않았습니다.{' '}
                <button onClick={() => navigate('/courses')} className="font-bold underline">과목 선택하기</button>
              </div>
            )}

            <div className="space-y-3">
              {/* 개별 추가 */}
              <div className="rounded border border-[#d3d3d3] bg-white p-4">
                <h3 className="mb-2 text-xs font-bold text-[#5a5a5a]">개별 학생 추가</h3>
                <div className="flex gap-2">
                  <input value={studentId} onChange={(e) => setStudentId(e.target.value)}
                    placeholder="학번 (예: 20201234)"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="h-7 w-36 rounded-sm border border-gray-300 px-2 text-xs focus:border-[#1a6d7e] focus:outline-none" />
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="이름"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="h-7 flex-1 rounded-sm border border-gray-300 px-2 text-xs focus:border-[#1a6d7e] focus:outline-none" />
                  <button onClick={handleAdd} disabled={adding || !selectedCourse}
                    className="rounded-sm bg-[#4d4d4d] px-4 py-1 text-xs font-bold text-white disabled:opacity-50">
                    {adding ? '추가 중...' : '추가'}
                  </button>
                </div>
                {singleMsg.text && (
                  <p className={`mt-1.5 text-xs ${singleMsg.type === 'ok' ? 'text-[#1a6d7e]' : 'text-red-500'}`}>
                    {singleMsg.text}
                  </p>
                )}
              </div>

              {/* 엑셀 일괄 등록 */}
              <div className="rounded border border-[#d3d3d3] bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#5a5a5a]">엑셀 일괄 등록</h3>
                  <span className="text-[11px] text-gray-400">학번 · 이름 열 포함 xlsx/csv</span>
                </div>

                {!bulkRows && !bulkResults && (
                  <>
                    <label htmlFor={fileInputId}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 bg-gray-50 py-3 text-xs text-gray-500 hover:border-[#1a6d7e] hover:text-[#1a6d7e]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      파일 선택 (xlsx / csv)
                    </label>
                    <input id={fileInputId} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                    {bulkParseError && <p className="mt-2 text-xs text-red-500">{bulkParseError}</p>}
                  </>
                )}

                {bulkRows && !bulkProgress && (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto rounded border border-gray-200">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#f3f3f3] text-gray-500">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">학번</th>
                            <th className="px-3 py-2 text-left">이름</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bulkRows.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-1.5 font-mono text-gray-600">{r.studentId}</td>
                              <td className="px-3 py-1.5 font-semibold text-gray-800">{r.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">총 {bulkRows.length}명</span>
                      <div className="flex gap-2">
                        <button onClick={() => setBulkRows(null)}
                          className="rounded-sm border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          취소
                        </button>
                        <button onClick={handleBulkRegister}
                          className="rounded-sm bg-[#1a6d7e] px-5 py-1.5 text-xs font-bold text-white hover:bg-teal-800">
                          일괄 등록 ({bulkRows.length}명)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {bulkProgress && !bulkResults && (
                  <div className="space-y-1.5 py-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{bulkProgress.phase === 'enroll' ? '수강 등록 중...' : '계정 생성 중...'}</span>
                      <span>{bulkProgress.done} / {bulkProgress.total}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-[#1a6d7e] transition-all"
                        style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                    </div>
                  </div>
                )}

                {bulkResults && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[#1a6d7e]">성공 {bulkResults.ok.length}명</span>
                      {bulkResults.fail.length > 0 && (
                        <span className="font-semibold text-red-500">실패 {bulkResults.fail.length}명</span>
                      )}
                    </div>
                    {bulkResults.fail.length > 0 && (
                      <div className="rounded border border-red-100 bg-red-50 p-2.5">
                        {bulkResults.fail.map((f, i) => (
                          <p key={i} className="text-xs text-red-500">{f.studentId} {f.name} — {f.reason}</p>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setBulkResults(null)} className="text-xs text-gray-400 underline">닫기</button>
                  </div>
                )}
              </div>

              {/* 수강생 목록 */}
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-400">불러오는 중...</div>
              ) : error ? (
                <div className="py-3 text-center text-xs text-red-500">{error}</div>
              ) : students.length === 0 ? (
                <div className="rounded border-2 border-dashed border-[#d3d3d3] bg-white py-10 text-center">
                  <p className="text-xs text-gray-400">등록된 학생이 없습니다.</p>
                  <p className="mt-1 text-[11px] text-gray-300">학번과 이름을 입력하거나 엑셀 파일을 업로드하세요.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded border border-[#d3d3d3]">
                  <table className="w-full border-t-2 border-[#7f7f7f] text-center text-[12px]">
                    <thead className="bg-[#8c8c8c]">
                      <tr className="border-b border-[#d3d3d3] text-xs font-bold text-gray-600">
                        <th className="w-10 py-2">번호</th>
                        <th className="w-28 py-2">학번</th>
                        <th className="px-3 py-2 text-left">이름</th>
                        <th className="w-16 py-2">수강 취소</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e2e2]">
                      {students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((s, i) => {
                const globalIdx = i + 1 + (currentPage - 1) * PAGE_SIZE;
                return (
                        <tr key={s.id} className="hover:bg-[#f0f7f9]">
                          <td className="py-2 text-gray-400">{globalIdx}</td>
                          <td className="py-2 font-mono text-[11px] text-gray-600">
                            {emailMap[s.userId] ?? '-'}
                          </td>
                          <td className="px-3 py-2 text-left font-semibold text-[#333]">{s.userName ?? s.name}</td>
                          <td className="py-2">
                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deleting === s.id}
                              className="rounded-sm border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
                            >
                              {deleting === s.id ? '...' : '취소'}
                            </button>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                  <Pagination currentPage={currentPage} totalPages={Math.ceil(students.length / PAGE_SIZE)} onPageChange={setCurrentPage} />
                  <div className="border-t border-[#d3d3d3] bg-[#f8f8f8] px-3 py-1.5 text-right text-[11px] text-gray-400">
                    전체 {students.length}명
                  </div>
                </div>
              )}
            </div>
          </div>
        </MainLayout>
        <Footer />
      </div>
    </div>
  );
};

export default CourseStudentManagePage;
