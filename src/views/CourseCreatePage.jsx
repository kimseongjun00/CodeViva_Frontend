import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { createCourse } from '../api/courses';
import { createCourseUser } from '../api/courseUsers';
import { getAllUsers } from '../api/auth';
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

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: '학생' },
  { value: 'TA', label: 'TA' },
  { value: 'TEACHER', label: '교수' },
];

const ROLE_BADGE = {
  TEACHER: 'bg-purple-100 text-purple-700',
  TA: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
};

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
            className="h-8 w-full border border-gray-300 px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none"
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
            className="h-8 w-[110px] border border-gray-300 px-2.5 text-sm focus:border-[#1a6d7e] focus:outline-none"
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
          className="rounded bg-[#1a6d7e] px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800 disabled:opacity-60"
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
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // checked: { [userId]: courseRole }
  const [checked, setChecked] = useState({});
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [enrollResults, setEnrollResults] = useState(null); // null | { ok: [], fail: [] }

  useEffect(() => {
    getAllUsers()
      .then((all) => setUsers(all.filter((u) => u.id !== me?.id)))
      .catch(() => setError('사용자 목록을 불러오지 못했습니다.'))
      .finally(() => setLoadingUsers(false));
  }, [me?.id]);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleUser = (userId) => {
    setChecked((prev) => {
      if (prev[userId] !== undefined) {
        const next = { ...prev };
        delete next[userId];
        return next;
      }
      return { ...prev, [userId]: 'STUDENT' };
    });
  };

  const setUserRole = (userId, role) => {
    setChecked((prev) => ({ ...prev, [userId]: role }));
  };

  const selectAll = () => {
    const next = {};
    filtered.forEach((u) => {
      next[u.id] = checked[u.id] ?? 'STUDENT';
    });
    setChecked((prev) => ({ ...prev, ...next }));
  };

  const clearAll = () => {
    const ids = new Set(filtered.map((u) => u.id));
    setChecked((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  };

  const checkedCount = Object.keys(checked).length;
  const allFilteredChecked =
    filtered.length > 0 && filtered.every((u) => checked[u.id] !== undefined);

  const handleEnroll = async () => {
    if (checkedCount === 0) {
      setError('등록할 수강생을 선택해주세요.');
      return;
    }
    setEnrolling(true);
    setError('');
    const ok = [];
    const fail = [];
    await Promise.allSettled(
      Object.entries(checked).map(([userId, courseRole]) =>
        createCourseUser({ courseId: course.id, userId: Number(userId), courseRole })
          .then((res) => ok.push(res))
          .catch(() => {
            const u = users.find((x) => x.id === Number(userId));
            fail.push(u?.name ?? userId);
          }),
      ),
    );
    setEnrolling(false);
    setEnrollResults({ ok, fail });
  };

  // 등록 완료 결과 화면
  if (enrollResults) {
    return (
      <div className="text-center py-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 mx-auto">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="mb-2 text-base font-bold text-slate-800">수강 등록 완료</h3>
        <p className="text-sm text-slate-500 mb-6">
          성공 <strong className="text-teal-600">{enrollResults.ok.length}명</strong>
          {enrollResults.fail.length > 0 && (
            <> · 실패 <strong className="text-red-500">{enrollResults.fail.length}명</strong>
              <span className="text-xs text-red-400"> ({enrollResults.fail.join(', ')})</span>
            </>
          )}
        </p>
        <button
          onClick={onDone}
          className="rounded bg-[#1a6d7e] px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800"
        >
          완료 →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-700">수강생 선택</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            과목: <strong>{course.name}</strong> (ID: {course.id})
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#1a6d7e]">{checkedCount}명 선택됨</div>
        </div>
      </div>

      {/* 검색 + 필터 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 flex-1 border border-gray-300 px-2.5 text-xs focus:border-[#1a6d7e] focus:outline-none min-w-[160px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-8 border border-gray-300 px-2 text-xs focus:outline-none"
        >
          <option value="ALL">전체 역할</option>
          <option value="STUDENT">학생</option>
          <option value="TEACHER">교수</option>
          <option value="ADMIN">관리자</option>
        </select>
        <button
          onClick={allFilteredChecked ? clearAll : selectAll}
          className="h-8 rounded border border-[#1a6d7e] px-3 text-xs font-bold text-[#1a6d7e] hover:bg-teal-50"
        >
          {allFilteredChecked ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      {/* 사용자 목록 테이블 */}
      {loadingUsers ? (
        <div className="py-8 text-center text-xs text-gray-400">불러오는 중...</div>
      ) : (
        <div className="overflow-hidden rounded border border-[#d3d3d3]">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#7f7f7f] text-white">
              <tr>
                <th className="w-10 px-3 py-2 text-center font-normal">선택</th>
                <th className="px-3 py-2 font-normal">이름</th>
                <th className="px-3 py-2 font-normal">이메일</th>
                <th className="w-20 px-3 py-2 font-normal text-center">시스템 역할</th>
                <th className="w-28 px-3 py-2 font-normal text-center">수강 역할 지정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8e8] bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isChecked = checked[u.id] !== undefined;
                  return (
                    <tr
                      key={u.id}
                      className={`cursor-pointer transition-colors ${isChecked ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleUser(u.id)}
                    >
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUser(u.id)}
                          className="h-3.5 w-3.5 accent-[#1a6d7e] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-3 py-2.5 text-slate-500">{u.email}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {isChecked ? (
                          <select
                            value={checked[u.id]}
                            onChange={(e) => setUserRole(u.id, e.target.value)}
                            className="h-6 rounded border border-gray-300 px-1 text-[10px] focus:outline-none accent-[#1a6d7e]"
                          >
                            {ROLE_OPTIONS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-xs text-slate-400">
          {checkedCount > 0
            ? `${checkedCount}명이 선택되었습니다.`
            : '등록할 수강생을 체크박스로 선택하세요.'}
        </span>
        <button
          onClick={handleEnroll}
          disabled={enrolling || checkedCount === 0}
          className="rounded bg-[#1a6d7e] px-8 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enrolling ? '등록 중...' : `수강 등록 (${checkedCount}명)`}
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
          className="rounded bg-[#1a6d7e] px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-800"
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
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[20px] leading-[28px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-52 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-full max-w-[1330px] px-6 pt-14">
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
