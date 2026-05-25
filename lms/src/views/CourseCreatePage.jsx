import React, { useState, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { createCourse } from '../api/courses';
import { createCourseUser, enrollStudentsBulk } from '../api/courseUsers';
import { registerStudentGetId } from '../api/auth';
import * as XLSX from 'xlsx';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';
import Sidebar from '../components/eclass/Sidebar';

const SEMESTERS = [
  { value: 'SPRING', label: '1학기 (봄)' },
  { value: 'SUMMER', label: '여름학기' },
  { value: 'FALL', label: '2학기 (가을)' },
  { value: 'WINTER', label: '겨울학기' },
];



/* ──────────────────────────────────────────────────────────
   Step indicator
────────────────────────────────────────────────────────── */
const StepBar = ({ step }) => (
  <div className="mb-8 flex items-center gap-0">
    {[{ n: 1, label: '과목 정보 입력' }, { n: 2, label: '수강생 등록' }, { n: 3, label: '완료' }].map(
      ({ n, label }, idx, arr) => (
        <React.Fragment key={n}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step >= n
                  ? 'bg-[#1a6d7e] text-white'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step > n ? '✓' : n}
            </div>
            <span
              className={`text-[10px] font-semibold whitespace-nowrap ${
                step >= n ? 'text-[#1a6d7e]' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
          {idx < arr.length - 1 && (
            <div
              className={`mb-4 h-[2px] flex-1 transition-all ${
                step > n ? 'bg-[#1a6d7e]' : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ),
    )}
  </div>
);

/* ──────────────────────────────────────────────────────────
   Step 1 – 과목 정보 입력
────────────────────────────────────────────────────────── */
const Step1CourseForm = ({ onCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    semester: 'SPRING',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('과목명을 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const course = await createCourse({
        name: form.name.trim(),
        year: Number(form.year),
        semester: form.semester,
      });
      onCreated(course);
    } catch (err) {
      if (err?.message === '400') {
        setError('교수 권한이 필요합니다.');
      } else {
        setError('과목 개설에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="mb-5 text-base font-bold text-slate-700">과목 기본 정보</h3>

      <div className="grid grid-cols-[140px_1fr] border-t-2 border-gray-500 text-xs">
        <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-3 font-bold text-gray-700 flex items-center">
          과목명 <span className="ml-1 text-red-500">*</span>
        </div>
        <div className="border-b border-gray-300 px-3 py-2">
          <input
            className="h-8 w-full rounded-sm border border-gray-300 px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none"
            placeholder="예) 게임프로그래밍"
            value={form.name}
            onChange={handleChange('name')}
          />
        </div>

        <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-3 font-bold text-gray-700 flex items-center">
          개설 연도 <span className="ml-1 text-red-500">*</span>
        </div>
        <div className="border-b border-gray-300 px-3 py-2">
          <input
            type="number"
            className="h-8 w-[110px] rounded-sm border border-gray-300 px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none"
            value={form.year}
            onChange={handleChange('year')}
            min={2020}
            max={2099}
          />
        </div>

        <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-3 font-bold text-gray-700 flex items-center">
          학기 <span className="ml-1 text-red-500">*</span>
        </div>
        <div className="border-b border-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-2 py-1">
            {SEMESTERS.map(({ value, label }) => (
              <label key={value} className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="radio"
                  name="semester"
                  value={value}
                  checked={form.semester === value}
                  onChange={handleChange('semester')}
                  className="accent-[#1a6d7e]"
                />
                <span className="text-xs text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-3 font-bold text-gray-700 flex items-center">
          개설 교수
        </div>
        <div className="border-b border-gray-300 px-3 py-2 flex items-center">
          <span className="text-sm text-slate-600">{user?.name}</span>
          <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">TEACHER</span>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-sm bg-[#1a6d7e] px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? '개설 중...' : '과목 개설 →'}
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Step 2 – 수강생 등록
────────────────────────────────────────────────────────── */
const Step2EnrollUsers = ({ course, onDone }) => {
  const fileInputId = useId();

  const [registered, setRegistered] = useState([]); // { studentId, name }
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [singleMsg, setSingleMsg] = useState({ type: '', text: '' });

  const [bulkRows, setBulkRows] = useState(null);
  const [bulkParseError, setBulkParseError] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);

  const registerStudentOnly = async ({ studentId: sid, name: n }) => {
    const { id: userId } = await registerStudentGetId({ studentId: sid.trim(), name: n.trim() });
    return { userId: Number(userId), studentId: sid.trim(), name: n.trim() };
  };

  const handleAdd = async () => {
    if (!studentId.trim() || !name.trim()) { setSingleMsg({ type: 'error', text: '학번과 이름을 입력해주세요.' }); return; }
    setAdding(true); setSingleMsg({ type: '', text: '' });
    try {
      const { userId, ...row } = await registerStudentOnly({ studentId, name });
      try {
        await createCourseUser({ courseId: course.id, userId, courseRole: 'STUDENT' });
      } catch (e) {
        if (e?.message !== '500' && e?.message !== '409') throw e;
      }
      setRegistered((p) => [...p, row]);
      setSingleMsg({ type: 'ok', text: `${name} 학생이 등록되었습니다.` });
      setStudentId(''); setName('');
    } catch (e) {
      setSingleMsg({ type: 'error', text: e?.message ?? '오류가 발생했습니다.' });
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
      } catch { setBulkParseError('파일을 읽을 수 없습니다.'); }
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

    for (let i = 0; i < bulkRows.length; i++) {
      try {
        const { userId, ...row } = await registerStudentOnly(bulkRows[i]);
        userIds.push(userId);
        ok.push(row);
      } catch (e) {
        fail.push({ ...bulkRows[i], reason: e?.message ?? '오류' });
      }
      setBulkProgress({ done: i + 1, total: bulkRows.length, phase: 'account' });
    }

    if (userIds.length > 0) {
      setBulkProgress({ done: userIds.length, total: userIds.length, phase: 'enroll' });
      try {
        await enrollStudentsBulk({ courseId: course.id, studentIds: userIds });
      } catch {
        fail.push(...ok.splice(0));
      }
    }

    setRegistered((p) => [...p, ...ok]);
    setBulkResults({ ok, fail });
    setBulkRows(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-700">수강생 등록</h3>
        <p className="mt-0.5 text-xs text-slate-400">과목: <strong>{course.name}</strong> (ID: {course.id})</p>
      </div>

      {/* 개별 추가 */}
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-bold text-slate-600">개별 추가</p>
        <div className="flex gap-2">
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)}
            placeholder="학번" onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-9 w-36 rounded-sm border border-gray-300 bg-white px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none" />
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="이름" onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-9 flex-1 rounded-sm border border-gray-300 bg-white px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none" />
          <button onClick={handleAdd} disabled={adding}
            className="rounded-sm bg-[#1a6d7e] px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60">
            {adding ? '...' : '추가'}
          </button>
        </div>
        {singleMsg.text && (
          <p className={`mt-1.5 text-xs ${singleMsg.type === 'ok' ? 'text-[#1a6d7e]' : 'text-red-500'}`}>{singleMsg.text}</p>
        )}
      </div>

      {/* 엑셀 일괄 */}
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-600">엑셀 일괄 등록</p>
          <span className="text-[11px] text-gray-400">학번·이름 열 포함 xlsx/csv</span>
        </div>
        {!bulkRows && !bulkResults && (
          <>
            <label htmlFor={fileInputId}
              className="flex cursor-pointer items-center justify-center gap-2 rounded border-2 border-dashed border-slate-300 bg-white py-4 text-xs text-slate-500 hover:border-[#1a6d7e] hover:text-[#1a6d7e]">
              파일 선택 (xlsx / csv)
            </label>
            <input id={fileInputId} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            {bulkParseError && <p className="mt-1 text-xs text-red-500">{bulkParseError}</p>}
          </>
        )}
        {bulkRows && !bulkProgress && (
          <div className="space-y-2">
            <div className="max-h-36 overflow-y-auto rounded border border-gray-200 bg-white text-xs">
              {bulkRows.map((r, i) => (
                <div key={i} className="flex gap-4 border-b border-gray-100 px-3 py-1.5 last:border-0">
                  <span className="text-gray-400">{i + 1}</span>
                  <span className="font-mono text-gray-600">{r.studentId}</span>
                  <span className="font-semibold text-gray-800">{r.name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">총 {bulkRows.length}명</span>
              <div className="flex gap-2">
                <button onClick={() => setBulkRows(null)} className="rounded-sm border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={handleBulkRegister} className="rounded-sm bg-[#1a6d7e] px-4 py-1 text-xs font-bold text-white hover:bg-teal-800">
                  일괄 등록 ({bulkRows.length}명)
                </button>
              </div>
            </div>
          </div>
        )}
        {bulkProgress && !bulkResults && (
          <div className="space-y-1 py-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{bulkProgress.phase === 'enroll' ? '수강 등록 중...' : '계정 생성 중...'}</span><span>{bulkProgress.done} / {bulkProgress.total}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-[#1a6d7e] transition-all"
                style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
            </div>
          </div>
        )}
        {bulkResults && (
          <div className="text-xs">
            <span className="font-semibold text-[#1a6d7e]">성공 {bulkResults.ok.length}명</span>
            {bulkResults.fail.length > 0 && <span className="ml-2 font-semibold text-red-500">실패 {bulkResults.fail.length}명</span>}
            <button onClick={() => setBulkResults(null)} className="ml-2 text-gray-400 underline">닫기</button>
          </div>
        )}
      </div>

      {/* 등록된 학생 목록 */}
      {registered.length > 0 && (
        <div className="rounded border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
            이번 세션 등록 완료 ({registered.length}명)
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
            {registered.map((r, i) => (
              <div key={i} className="flex gap-4 px-4 py-2 text-xs">
                <span className="text-gray-400">{i + 1}</span>
                <span className="font-mono text-gray-600">{r.studentId}</span>
                <span className="font-semibold text-gray-800">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button onClick={onDone}
          className="rounded-sm bg-[#1a6d7e] px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800">
          {registered.length > 0 ? `완료 (${registered.length}명 등록됨) →` : '건너뛰기 →'}
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Step 3 – 완료
────────────────────────────────────────────────────────── */
const Step3Done = ({ course, navigate, selectCourse }) => {
  const handleGoToCourse = () => {
    selectCourse({ id: course.id, name: course.name, year: course.year, semester: course.semester });
    navigate('/instructor/assignment-list');
  };

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
      </div>
      <h3 className="mb-1 text-xl font-bold text-slate-800">과목 개설 완료!</h3>
      <p className="mb-4 text-sm text-slate-500">
        <strong className="text-[#1a6d7e]">{course.name}</strong> 과목이 성공적으로 개설되었습니다.
      </p>

      {/* 과목 ID 공유 박스 */}
      <div className="mb-6 w-full max-w-sm rounded-xl border-2 border-dashed border-[#1a6d7e]/40 bg-teal-50 px-6 py-4">
        <p className="mb-1 text-xs font-semibold text-teal-600 uppercase tracking-wide">학생에게 공유할 과목 ID</p>
        <div className="text-4xl font-extrabold tracking-widest text-[#1a6d7e]">{course.id}</div>
        <p className="mt-2 text-[11px] text-slate-500">
          학생은 수강과목 페이지에서 이 ID를 입력하면 과목에 입장할 수 있습니다.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/courses')}
          className="rounded border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          과목 목록으로
        </button>
        <button
          onClick={handleGoToCourse}
          className="rounded-sm bg-[#1a6d7e] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800"
        >
          과제 관리 바로가기 →
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   메인 페이지
────────────────────────────────────────────────────────── */
const CourseCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectCourse } = useCourse();

  const [step, setStep] = useState(1);
  const [createdCourse, setCreatedCourse] = useState(null);

  const handleCourseCreated = (course) => {
    setCreatedCourse(course);
    setStep(2);
  };

  const handleEnrollDone = () => {
    setStep(3);
  };

  const sidebar = <Sidebar currentPath={location.pathname} />;

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={sidebar}>
          <div>
            {/* 페이지 타이틀 */}
            <div className="mb-5 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
              <h2 className="text-[30px] leading-none font-bold text-[#5a5a5a]">과목 개설</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="rounded-sm bg-[#1a6d7e] px-1 text-[10px] text-white">H</span>
                <span>›</span>
                <span className="font-bold text-[#1a6d7e]">과목 개설</span>
              </div>
            </div>

            {/* 카드 */}
            <div className="rounded-xl border border-[#d3d3d3] bg-white p-7 shadow-sm">
              <StepBar step={step} />

              {step === 1 && <Step1CourseForm onCreated={handleCourseCreated} />}
              {step === 2 && (
                <Step2EnrollUsers course={createdCourse} onDone={handleEnrollDone} />
              )}
              {step === 3 && (
                <Step3Done
                  course={createdCourse}
                  navigate={navigate}
                  selectCourse={selectCourse}
                />
              )}
            </div>
          </div>
        </MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );
};

export default CourseCreatePage;
