'use client';

import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import {
  getCourses, createCourse,
  getCourseUsers, enrollStudent, enrollStudentsBulk, registerStudentGetId, getAllUsers,
  getAssignmentsByCourse, createAssignment, updateAssignment, deleteAssignment,
  getSubmissionsByAssignment, getAnswersBySubmission, evaluateAssignment,
} from '../../../lib/api';

const SEMESTER_KO = { SPRING: '1학기', SUMMER: '여름학기', FALL: '2학기', WINTER: '겨울학기' };

// GRADE_1(최우수) ~ GRADE_5(최하) — 서버에서 내려오는 값 그대로 사용
const GRADE_CFG = {
  GRADE_1: { label: '1등급', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  GRADE_2: { label: '2등급', bg: 'bg-sky-100',     text: 'text-sky-700' },
  GRADE_3: { label: '3등급', bg: 'bg-amber-100',   text: 'text-amber-700' },
  GRADE_4: { label: '4등급', bg: 'bg-orange-100',  text: 'text-orange-700' },
  GRADE_5: { label: '5등급', bg: 'bg-red-100',     text: 'text-red-700' },
};

// 질문별 level 표시용
const LEVEL_CFG = {
  excellent: { label: 'excellent', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  great:     { label: 'great',     bg: 'bg-sky-100',     text: 'text-sky-700' },
  good:      { label: 'good',      bg: 'bg-teal-100',    text: 'text-teal-700' },
  bad:       { label: 'bad',       bg: 'bg-orange-100',  text: 'text-orange-700' },
  miss:      { label: 'miss',      bg: 'bg-red-100',     text: 'text-red-700' },
};

// 등급 분포용 숫자 순서
const GRADE_ORDER = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5'];

// 보안 위험도 계산
const RISK_RULES = [
  { key: 'devToolsCount',       label: 'DevTools',    weight: 5, thresholds: [Infinity, 1] },
  { key: 'tabSwitchCount',      label: '탭 전환',      weight: 4, thresholds: [1, 2] },
  { key: 'windowBlurCount',     label: '앱 전환',      weight: 3, thresholds: [2, 4] },
  { key: 'micMuteCount',        label: '음소거',        weight: 3, thresholds: [1, 2] },
  { key: 'fullscreenExitCount', label: '전체화면 해제', weight: 2, thresholds: [1, 2] },
  { key: 'cursorOutCount',      label: '커서 이탈',    weight: 1, thresholds: [3, 6] },
  { key: 'totalSilenceCount',   label: '무음',          weight: 1, thresholds: [2, 4] },
];
const MAX_RISK_SCORE = RISK_RULES.reduce((s, r) => s + r.weight * 2, 0);

const computeSecurityRisk = (sub) => {
  if (sub.tabSwitchCount == null) return null; // 모니터링 데이터 없음
  const items = RISK_RULES.map((r) => {
    const count = sub[r.key] ?? 0;
    const [yellowAt, redAt] = r.thresholds;
    const level = count >= redAt ? 'red' : count >= yellowAt ? 'yellow' : 'green';
    return { ...r, count, level };
  });
  const score = items.reduce((s, i) => s + i.weight * (i.level === 'red' ? 2 : i.level === 'yellow' ? 1 : 0), 0);
  const hasHighRed = items.some((i) => i.level === 'red' && i.weight >= 4);
  const ratio = score / MAX_RISK_SCORE;
  const overall = hasHighRed || ratio > 0.4 ? 'red' : ratio > 0.15 ? 'yellow' : 'green';
  return { items, overall };
};

const RISK_CFG = {
  red:    { label: '의심', bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500' },
  yellow: { label: '주의', bg: 'bg-amber-100',  text: 'text-amber-600',  dot: 'bg-amber-400' },
  green:  { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

/* ─── 학생 등록 탭 ─── */
function StudentsTab({ courseId }) {
  const fileInputId = useId();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 개별 추가
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [singleError, setSingleError] = useState('');
  const [singleSuccess, setSingleSuccess] = useState('');

  // 엑셀 일괄 등록
  const [bulkRows, setBulkRows] = useState(null); // [{studentId, name}] | null
  const [bulkParseError, setBulkParseError] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null); // {done, total}
  const [bulkResults, setBulkResults] = useState(null); // {ok: [], fail: []}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, allUsers] = await Promise.all([
        getCourseUsers(courseId),
        getAllUsers().catch(() => []),
      ]);
      const emailMap = Object.fromEntries((allUsers || []).map((u) => [u.id, u.email ?? '']));
      setStudents(
        list
          .filter((u) => u.courseRole === 'STUDENT')
          .map((u) => ({
            ...u,
            studentIdNum: emailMap[u.userId]?.replace('@codeviva.kr', '') ?? String(u.userId),
          }))
      );
    } catch (e) {
      console.error('학생 목록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const registerOne = async ({ studentId: sid, name: n }) => {
    const { id: userId } = await registerStudentGetId({ studentId: sid.trim(), name: n.trim() });
    try {
      await enrollStudent({ courseId: Number(courseId), userId: Number(userId) });
    } catch (e) {
      const code = e?.message;
      if (code !== '500' && code !== '409') throw e;
    }
  };

  const handleAdd = async () => {
    if (!studentId.trim() || !name.trim()) { setSingleError('학번과 이름을 입력해주세요.'); return; }
    setAdding(true); setSingleError(''); setSingleSuccess('');
    try {
      await registerOne({ studentId, name });
      setSingleSuccess(`${name} 학생이 등록되었습니다.`);
      setStudentId(''); setName('');
      await load();
    } catch (e) {
      const msg = e?.message ?? '알 수 없는 오류';
      if (msg.includes('401')) setSingleError('세션이 만료됐습니다. 다시 로그인해주세요.');
      else setSingleError(msg);
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

        // 헤더 유연하게 매핑 (학번/학생번호/id, 이름/성명/name)
        const idKey = Object.keys(raw[0] ?? {}).find((k) =>
          /학번|학생번호|studentid|id/i.test(k)
        );
        const nameKey = Object.keys(raw[0] ?? {}).find((k) =>
          /이름|성명|name/i.test(k)
        );

        if (!idKey || !nameKey) {
          setBulkParseError('엑셀에 "학번"과 "이름" 열이 필요합니다.');
          return;
        }

        const rows = raw
          .map((r) => ({ studentId: String(r[idKey]).trim(), name: String(r[nameKey]).trim() }))
          .filter((r) => r.studentId && r.name);

        if (rows.length === 0) { setBulkParseError('유효한 데이터가 없습니다.'); return; }
        setBulkRows(rows);
      } catch {
        setBulkParseError('파일을 읽을 수 없습니다. xlsx 또는 csv 파일을 사용해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleBulkRegister = async () => {
    if (!bulkRows?.length) return;
    setBulkProgress({ done: 0, total: bulkRows.length, phase: 'account' });
    setBulkResults(null);
    const ok = [], fail = [], userIds = [];

    // 1단계: 계정 생성/조회
    for (let i = 0; i < bulkRows.length; i++) {
      const row = bulkRows[i];
      try {
        const { id: userId } = await registerStudentGetId({
          studentId: row.studentId.trim(),
          name: row.name.trim(),
        });
        userIds.push(userId);
        ok.push(row);
      } catch (e) {
        fail.push({ ...row, reason: e?.message ?? '계정 생성 오류' });
      }
      setBulkProgress({ done: i + 1, total: bulkRows.length, phase: 'account' });
    }

    // 2단계: 일괄 수강 등록 (단일 API 호출)
    if (userIds.length > 0) {
      setBulkProgress({ done: userIds.length, total: userIds.length, phase: 'enroll' });
      try {
        await enrollStudentsBulk({ courseId: Number(courseId), studentIds: userIds });
      } catch {
        fail.push(...ok.splice(0).map((r) => ({ ...r, reason: '수강 등록 오류' })));
      }
    }

    setBulkResults({ ok, fail });
    setBulkRows(null);
    await load();
  };

  const resetBulk = () => { setBulkRows(null); setBulkResults(null); setBulkParseError(''); };

  return (
    <div className="space-y-6">
      {/* 개별 추가 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="mb-4 text-sm font-bold text-slate-700">개별 추가</h3>
        <div className="flex gap-3">
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)}
            placeholder="학번" onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none" />
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="이름" onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none" />
          <button onClick={handleAdd} disabled={adding}
            className="h-10 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
            {adding ? '...' : '등록'}
          </button>
        </div>
        {singleError && <p className="mt-2 text-xs text-red-500">{singleError}</p>}
        {singleSuccess && <p className="mt-2 text-xs text-teal-600">{singleSuccess}</p>}
      </div>

      {/* 엑셀 일괄 등록 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">엑셀 일괄 등록</h3>
          <span className="text-xs text-slate-400">학번 · 이름 열 포함 xlsx/csv</span>
        </div>

        {!bulkRows && !bulkResults && (
          <>
            <label htmlFor={fileInputId}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-6 text-sm text-slate-500 transition hover:border-teal-400 hover:text-teal-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              파일 선택 (xlsx / csv)
            </label>
            <input id={fileInputId} type="file" accept=".xlsx,.xls,.csv"
              onChange={handleFileChange} className="hidden" />
            {bulkParseError && <p className="mt-2 text-xs text-red-500">{bulkParseError}</p>}
          </>
        )}

        {/* 파싱 미리보기 */}
        {bulkRows && !bulkProgress && (
          <div className="space-y-3">
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">학번</th>
                    <th className="px-3 py-2 text-left">이름</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-slate-600">{r.studentId}</td>
                      <td className="px-3 py-1.5 font-semibold text-slate-800">{r.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">총 {bulkRows.length}명</span>
              <div className="flex gap-2">
                <button onClick={resetBulk}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  취소
                </button>
                <button onClick={handleBulkRegister}
                  className="h-9 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white hover:bg-teal-700">
                  일괄 등록 ({bulkRows.length}명)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 진행 중 */}
        {bulkProgress && !bulkResults && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{bulkProgress.phase === 'enroll' ? '수강 등록 중...' : '계정 생성 중...'}</span>
              <span>{bulkProgress.done} / {bulkProgress.total}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-teal-500 transition-all"
                style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 결과 */}
        {bulkResults && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-teal-600">성공 {bulkResults.ok.length}명</span>
              {bulkResults.fail.length > 0 && (
                <span className="font-semibold text-red-500">실패 {bulkResults.fail.length}명</span>
              )}
            </div>
            {bulkResults.fail.length > 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="mb-1 text-xs font-semibold text-red-600">등록 실패 목록</p>
                {bulkResults.fail.map((f, i) => (
                  <p key={i} className="text-xs text-red-500">
                    {f.studentId} {f.name} — {f.reason}
                  </p>
                ))}
              </div>
            )}
            <button onClick={resetBulk}
              className="mt-1 text-xs text-slate-400 underline underline-offset-2">
              닫기
            </button>
          </div>
        )}
      </div>

      {/* 학생 목록 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center text-slate-400">
          <p className="text-sm">등록된 학생이 없습니다.</p>
          <p className="mt-1 text-xs text-slate-300">학번과 이름을 입력하거나 엑셀 파일을 업로드하세요.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold text-slate-500">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">학번</th>
                <th className="px-4 py-3 text-left">이름</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.studentIdNum}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{s.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-right text-xs text-slate-400">
            총 {students.length}명
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 과제 출제 탭 ─── */
function AssignmentsTab({ courseId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const toLocal = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const defaultOpenAt = () => toLocal(new Date(Date.now() - 10 * 60 * 1000)); // 10분 전
  const defaultDueAt = () => toLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)); // 2주 후
  const [form, setForm] = useState({
    number: '',
    title: '',
    description: '',
    openAt: defaultOpenAt(),
    dueAt: defaultDueAt(),
    score: '100',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [editAttachment, setEditAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setAssignments(await getAssignmentsByCourse(courseId)); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.number.trim()) { setError('문제 번호를 입력해주세요.'); return; }
    if (!form.title.trim()) { setError('과제명을 입력해주세요.'); return; }
    if (!form.openAt || !form.dueAt) { setError('공개일과 마감일을 입력해주세요.'); return; }
    const fullTitle = `${form.number.trim()}. ${form.title.trim()}`;
    setSaving(true); setError('');
    try {
      await createAssignment({
        courseId,
        title: fullTitle,
        description: form.description.trim() || undefined,
        openAt: new Date(form.openAt).toISOString().slice(0, 19),
        dueAt: new Date(form.dueAt).toISOString().slice(0, 19),
        score: Number(form.score) || 100,
        attachment: attachment ?? undefined,
      });
      setForm({ number: '', title: '', description: '', openAt: defaultOpenAt(), dueAt: defaultDueAt(), score: '100' });
      setAttachment(null);
      setShowForm(false);
      await load();
    } catch { setError('과제 출제에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('과제를 삭제하시겠습니까?')) return;
    try {
      await deleteAssignment(id);
      await load();
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const startEdit = (a) => {
    const toLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };
    setEditingId(a.id);
    setEditForm({ title: a.title, description: a.description ?? '', openAt: toLocal(a.openAt), dueAt: toLocal(a.dueAt), score: String(a.score ?? 100) });
    setEditAttachment(null);
    setRemoveAttachment(false);
    setEditError('');
  };

  const handleUpdate = async (id) => {
    if (!editForm.title.trim()) { setEditError('과제명을 입력해주세요.'); return; }
    setEditSaving(true); setEditError('');
    try {
      await updateAssignment({
        id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        openAt: new Date(editForm.openAt).toISOString().slice(0, 19),
        dueAt: new Date(editForm.dueAt).toISOString().slice(0, 19),
        score: Number(editForm.score) || 100,
        attachment: editAttachment ?? undefined,
        removeAttachment: removeAttachment || undefined,
      });
      setEditingId(null);
      setEditAttachment(null);
      setRemoveAttachment(false);
      await load();
    } catch (e) {
      setEditError(`수정 실패 (${e?.message}) — 백엔드 오류일 수 있습니다.`);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      {/* 과제 출제 버튼 */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="mb-5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700">
          + 과제 출제
        </button>
      )}

      {/* 출제 폼 */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="mb-4 text-sm font-bold text-slate-700">새 과제</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">문제 번호 · 과제명 *</label>
              <div className="flex items-center gap-2">
                <input
                  value={form.number} onChange={set('number')}
                  placeholder="1"
                  className="h-10 w-16 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                />
                <span className="text-sm font-bold text-slate-400">.</span>
                <input
                  value={form.title} onChange={set('title')}
                  placeholder="예) 스택 구현하기"
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">과제 설명</label>
              <textarea value={form.description} onChange={set('description')} rows={3}
                placeholder="문제 설명, 조건, 입출력 예시 등"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm resize-none focus:border-teal-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">공개일 *</label>
                <input type="datetime-local" value={form.openAt} onChange={set('openAt')}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">마감일 *</label>
                <input type="datetime-local" value={form.dueAt} onChange={set('dueAt')}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">배점</label>
              <input type="number" value={form.score} onChange={set('score')}
                className="h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">첨부파일 (PDF)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-500 transition hover:border-teal-400 hover:text-teal-600">
                <span>📎</span>
                <span className="truncate">{attachment ? attachment.name : 'PDF 파일 선택 (선택사항)'}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
              </label>
              {attachment && (
                <button onClick={() => setAttachment(null)} className="mt-1 text-xs text-slate-400 hover:text-red-500">× 파일 제거</button>
              )}
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button onClick={() => { setShowForm(false); setAttachment(null); setError(''); }}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              취소
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-60">
              {saving ? '출제 중...' : '과제 출제'}
            </button>
          </div>
        </div>
      )}

      {/* 과제 목록 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center text-slate-400">
          <p className="text-sm">출제된 과제가 없습니다.</p>
          <p className="mt-1 text-xs text-slate-300">과제 출제 버튼을 눌러 새 과제를 만드세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const now = new Date();
            const open = new Date(a.openAt);
            const due = new Date(a.dueAt);
            const status = now < open ? '예정' : now > due ? '종료' : '진행중';
            const statusCls = status === '진행중' ? 'text-teal-600 bg-teal-50' : 'text-slate-400 bg-slate-100';

            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {editingId === a.id ? (
                  /* 수정 폼 */
                  <div className="space-y-3">
                    <input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-[#146E7A] focus:outline-none" />
                    <textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="설명"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 resize-none focus:border-[#146E7A] focus:outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">공개일</label>
                        <input type="datetime-local" value={editForm.openAt} onChange={(e) => setEditForm(p => ({ ...p, openAt: e.target.value }))}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">마감일</label>
                        <input type="datetime-local" value={editForm.dueAt} onChange={(e) => setEditForm(p => ({ ...p, dueAt: e.target.value }))}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none" />
                      </div>
                    </div>
                    <input type="number" value={editForm.score} onChange={(e) => setEditForm(p => ({ ...p, score: e.target.value }))}
                      placeholder="배점" className="h-10 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none" />
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">첨부파일 (PDF)</label>
                      {a.attachmentDownloadUrl && !removeAttachment && (
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
                          <span>현재: <a href={a.attachmentDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-[#146E7A] underline">첨부된 PDF</a></span>
                          <button type="button" onClick={() => setRemoveAttachment(true)} className="text-red-400 hover:text-red-600">삭제</button>
                        </div>
                      )}
                      {removeAttachment && (
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-red-500">
                          <span>기존 파일이 삭제됩니다.</span>
                          <button type="button" onClick={() => setRemoveAttachment(false)} className="text-slate-400 hover:text-slate-600">취소</button>
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-400 transition hover:border-teal-400">
                        <span>📎</span>
                        <span className="truncate">{editAttachment ? editAttachment.name : '새 PDF 파일 선택 (선택사항)'}</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => setEditAttachment(e.target.files?.[0] ?? null)} />
                      </label>
                      {editAttachment && (
                        <button type="button" onClick={() => setEditAttachment(null)} className="mt-1 text-xs text-slate-400 hover:text-red-500">× 파일 제거</button>
                      )}
                    </div>
                    {editError && <p className="text-xs text-red-500">{editError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(null); setEditAttachment(null); setRemoveAttachment(false); }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">취소</button>
                      <button onClick={() => handleUpdate(a.id)} disabled={editSaving}
                        className="rounded-xl bg-[#146E7A] px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60">
                        {editSaving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 일반 보기 */
                  <>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-slate-900">{a.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusCls}`}>{status}</span>
                          {a.attachmentDownloadUrl && (
                            <a href={a.attachmentDownloadUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-slate-600">
                              📎 {a.attachmentOriginalName || 'PDF'}
                            </a>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {new Date(a.openAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {' ~ '}
                          {new Date(a.dueAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {a.score != null && ` · ${a.score}점`}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(a)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                          수정
                        </button>
                        <button onClick={() => handleDelete(a.id)}
                          className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50">
                          삭제
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── 결과 탭 ─── */
function ResultsTab({ courseId }) {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [emailMap, setEmailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [evalStatus, setEvalStatus] = useState('idle'); // 'idle'|'triggering'|'running'|'done'
  const [evalError, setEvalError] = useState('');
  const evalPollingRef = useRef(null);
  const statusPollingRef = useRef(null);

  const AI_STATUS = {
    QUESTION_GENERATING:    { label: '질문 생성 중',   cls: 'bg-amber-50 text-amber-600' },
    AWAITING_AUDIO_ANSWERS: { label: '인터뷰 대기',    cls: 'bg-blue-50 text-blue-600' },
    AWAITING_EVALUATION:    { label: '평가 대기',      cls: 'bg-purple-50 text-purple-600' },
    EVALUATING:             { label: '평가 중',        cls: 'bg-indigo-50 text-indigo-600' },
    EVALUATED:              { label: '평가 완료',      cls: 'bg-emerald-50 text-emerald-600' },
    EVALUATION_FAILED:      { label: '평가 실패',      cls: 'bg-red-50 text-red-600' },
  };

  useEffect(() => {
    getAssignmentsByCourse(courseId).then((list) => {
      setAssignments(list);
      if (list.length > 0) loadResults(list[list.length - 1]);
    });
    getAllUsers().then((users) => {
      setEmailMap(Object.fromEntries(users.map((u) => [u.id, u.email ?? ''])));
    }).catch(() => {});
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSubmissions = useCallback(async (assignmentId) => {
    try {
      const subs = await getSubmissionsByAssignment(assignmentId);
      setSubmissions(subs);
      return subs;
    } catch { return []; }
  }, []);

  const startEvaluation = useCallback(async (assignmentId) => {
    setEvalStatus('triggering');
    setEvalError('');
    try {
      await evaluateAssignment(assignmentId);
      setEvalStatus('running');
      const poll = async () => {
        const subs = await refreshSubmissions(assignmentId);
        const evaluatable = subs.filter((s) =>
          s.aiValidationStatus === 'AWAITING_EVALUATION' ||
          s.aiValidationStatus === 'EVALUATING' ||
          s.aiValidationStatus === 'EVALUATED' ||
          s.aiValidationStatus === 'EVALUATION_FAILED'
        );
        const allSettled = evaluatable.length > 0 && evaluatable.every(
          (s) => s.aiValidationStatus === 'EVALUATED' || s.aiValidationStatus === 'EVALUATION_FAILED'
        );
        if (allSettled) {
          setEvalStatus('done');
          const pairs = await Promise.all(
            subs.map(async (s) => {
              try { return [s.id, await getAnswersBySubmission(s.id)]; }
              catch { return [s.id, []]; }
            })
          );
          setAnswersMap(Object.fromEntries(pairs));
          return;
        }
        evalPollingRef.current = setTimeout(poll, 10000);
      };
      poll();
    } catch {
      setEvalError('평가 시작에 실패했습니다. 다시 시도해주세요.');
      setEvalStatus('idle');
    }
  }, [refreshSubmissions]);

  const loadResults = async (assignment) => {
    clearTimeout(evalPollingRef.current);
    clearInterval(statusPollingRef.current);
    setSelected(assignment);
    setEvalStatus('idle');
    setEvalError('');
    setLoading(true);
    setAnswersMap({});
    setExpanded(null);
    try {
      const subs = await getSubmissionsByAssignment(assignment.id);
      setSubmissions(subs);
      const pairs = await Promise.all(
        subs.map(async (s) => {
          try { return [s.id, await getAnswersBySubmission(s.id)]; }
          catch { return [s.id, []]; }
        })
      );
      setAnswersMap(Object.fromEntries(pairs));
    } finally {
      setLoading(false);
    }
  };

  // 제출 상태가 중간 단계면 8초마다 자동 갱신
  useEffect(() => {
    clearInterval(statusPollingRef.current);
    if (!selected) return;
    const needsPolling = submissions.some((s) =>
      s.aiValidationStatus === 'QUESTION_GENERATING' ||
      s.aiValidationStatus === 'AWAITING_AUDIO_ANSWERS'
    );
    if (!needsPolling) return;
    statusPollingRef.current = setInterval(async () => {
      const updated = await refreshSubmissions(selected.id).catch(() => []);
      const stillPending = updated.some((s) =>
        s.aiValidationStatus === 'QUESTION_GENERATING' ||
        s.aiValidationStatus === 'AWAITING_AUDIO_ANSWERS'
      );
      if (!stillPending) clearInterval(statusPollingRef.current);
    }, 8000);
    return () => clearInterval(statusPollingRef.current);
  }, [selected, submissions, refreshSubmissions]);

  const getStudentId = (userId) =>
    emailMap[userId]?.replace('@codeviva.kr', '') ?? String(userId ?? '-');

  return (
    <div>
      {/* 과제 선택 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {assignments.map((a) => (
          <button key={a.id} onClick={() => loadResults(a)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${selected?.id === a.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}>
            {a.title}
          </button>
        ))}
        {assignments.length === 0 && <p className="text-sm text-slate-400">출제된 과제가 없습니다.</p>}
      </div>

      {selected && (
        <>
          {/* 헤더: 과제명 + 새로고침 */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">{selected.title}</h3>
            <button onClick={() => loadResults(selected)} disabled={loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50">
              {loading ? '갱신 중...' : '새로고침'}
            </button>
          </div>

          {/* 등급 분포 */}
          {!loading && (() => {
            const gc = Object.fromEntries(GRADE_ORDER.map((g) => [g, 0]));
            gc.pending = 0;
            submissions.forEach((s) => {
              if (s.grade && gc[s.grade] !== undefined) gc[s.grade]++;
              else gc.pending++;
            });
            return (
              <div className="mb-5 grid grid-cols-6 gap-2">
                {GRADE_ORDER.map((g) => {
                  const c = GRADE_CFG[g];
                  return (
                    <div key={g} className={`flex flex-col items-center rounded-xl py-3 ${c.bg}`}>
                      <span className={`text-sm font-extrabold ${c.text}`}>{c.label}</span>
                      <span className={`text-xs font-bold ${c.text}`}>{gc[g]}명</span>
                    </div>
                  );
                })}
                <div className="flex flex-col items-center rounded-xl bg-slate-100 py-3">
                  <span className="text-sm font-extrabold text-slate-400">미완료</span>
                  <span className="text-xs font-bold text-slate-400">{gc.pending}명</span>
                </div>
              </div>
            );
          })()}

          {/* 이해도 평가 트리거 */}
          {!loading && (() => {
            const readyCount = submissions.filter((s) =>
              s.aiValidationStatus === 'AWAITING_EVALUATION' || s.aiValidationStatus === 'EVALUATING'
            ).length;
            const evaluatedCount = submissions.filter((s) => s.aiValidationStatus === 'EVALUATED').length;
            const failedCount = submissions.filter((s) => s.aiValidationStatus === 'EVALUATION_FAILED').length;
            const canTrigger = evalStatus === 'idle' || evalStatus === 'done';
            return (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="text-sm font-bold text-slate-700">AI 이해도 평가</div>
                  <div className="mt-0.5 text-xs text-slate-400">음성 인터뷰를 완료한 학생들을 일괄 평가합니다 (배치, 최대 2시간 소요).</div>
                  {evalError && <div className="mt-1 text-xs font-semibold text-red-500">{evalError}</div>}
                </div>
                <div className="flex items-center gap-3">
                  {(evalStatus === 'running' || evalStatus === 'done') && submissions.length > 0 && (
                    <div className="min-w-[130px]">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>완료</span>
                        <span className="font-bold">{evaluatedCount + failedCount} / {submissions.length}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all duration-700"
                          style={{ width: `${submissions.length ? ((evaluatedCount + failedCount) / submissions.length) * 100 : 0}%` }}
                        />
                      </div>
                      {failedCount > 0 && <div className="mt-0.5 text-[10px] text-red-400">실패 {failedCount}건 포함</div>}
                    </div>
                  )}
                  {evalStatus === 'running' && (
                    <svg className="h-4 w-4 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  )}
                  {evalStatus === 'done' && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">평가 완료</span>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => startEvaluation(selected.id)}
                      disabled={!canTrigger || readyCount === 0}
                      className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {evalStatus === 'triggering' ? '시작 중...' : evalStatus === 'running' ? '평가 중...' : '이해도 평가 시작'}
                    </button>
                    {readyCount === 0 && canTrigger && (
                      <span className="text-[10px] text-slate-400">평가 대기 중인 제출이 없습니다</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center text-slate-400">
              <p className="text-sm">제출한 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3 text-left">학번</th>
                    <th className="px-4 py-3 text-left">이름</th>
                    <th className="px-4 py-3 text-center">상태</th>
                    <th className="px-4 py-3 text-center">평균 등급</th>
                    <th className="px-4 py-3 text-center">문항별 등급</th>
                    <th className="px-4 py-3 text-center">이상패턴</th>
                    <th className="px-4 py-3 text-center">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const gradeCfg = sub.grade ? GRADE_CFG[sub.grade] : null;
                    const isExpanded = expanded === sub.id;
                    const answers = (answersMap[sub.id] ?? []).slice().sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
                    const risk = computeSecurityRisk(sub);
                    const riskCfg = risk ? RISK_CFG[risk.overall] : null;

                    const LEVEL_BADGE = {
                      excellent: { bg: 'bg-emerald-500', text: 'text-white', letter: 'E' },
                      good:      { bg: 'bg-yellow-400',  text: 'text-white', letter: 'G' },
                      bad:       { bg: 'bg-orange-500',  text: 'text-white', letter: 'B' },
                      miss:      { bg: 'bg-red-500',     text: 'text-white', letter: 'M' },
                    };

                    return (
                      <React.Fragment key={sub.id}>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{getStudentId(sub.userId)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{sub.userName ?? '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {(() => { const s = AI_STATUS[sub.aiValidationStatus]; return s ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span> : <span className="text-xs text-slate-300">-</span>; })()}
                          </td>
                          {/* 평균 등급 */}
                          <td className="px-4 py-3 text-center">
                            {gradeCfg ? (
                              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${gradeCfg.bg} ${gradeCfg.text}`}>
                                {gradeCfg.label}
                              </span>
                            ) : <span className="text-xs text-slate-300">-</span>}
                          </td>
                          {/* 문항별 등급 신호등 */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {[0, 1, 2].map((qi) => {
                                const lv = answers[qi]?.level?.toLowerCase();
                                const cfg = lv ? (LEVEL_BADGE[lv] ?? null) : null;
                                return cfg ? (
                                  <span key={qi} title={lv}
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${cfg.bg} ${cfg.text}`}>
                                    {cfg.letter}
                                  </span>
                                ) : (
                                  <span key={qi} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-400">-</span>
                                );
                              })}
                            </div>
                          </td>
                          {/* 이상패턴 */}
                          <td className="px-4 py-3 text-center">
                            {riskCfg ? (
                              <span className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${riskCfg.bg} ${riskCfg.text}`}>
                                <span className={`h-2 w-2 rounded-full ${riskCfg.dot}`} />
                                {riskCfg.label}
                              </span>
                            ) : <span className="text-xs text-slate-300">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setExpanded(isExpanded ? null : sub.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                              {isExpanded ? '접기 ▲' : '자세히 보기 ▼'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${sub.id}-detail`}>
                            <td colSpan={8} className="bg-slate-50 px-6 py-5">
                              <div className="space-y-3">

                                {/* 문항별 답변 — 세로 배열, 각 문항 토글 */}
                                {answers.length === 0 ? (
                                  <p className="text-xs text-slate-400">아직 답변이 없습니다.</p>
                                ) : answers.map((ans, i) => {
                                  const lv = ans.level?.toLowerCase();
                                  const lvCfg = lv ? LEVEL_CFG[lv] : null;
                                  const lvBadge = lv ? (LEVEL_BADGE[lv] ?? null) : null;
                                  return (
                                    <details key={ans.id ?? i} className="group rounded-xl border border-slate-200 bg-white">
                                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
                                        <div className="flex items-center gap-2">
                                          {lvBadge ? (
                                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${lvBadge.bg} ${lvBadge.text}`}>{lvBadge.letter}</span>
                                          ) : (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-400">-</span>
                                          )}
                                          <span className="text-sm font-bold text-slate-700">Q{ans.questionOrder ?? i + 1}</span>
                                          <span className="text-xs text-slate-500 line-clamp-1 max-w-xs">{ans.questionText}</span>
                                          {lvCfg && (
                                            <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${lvCfg.bg} ${lvCfg.text}`}>{lvCfg.label}</span>
                                          )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                          {ans.earnedQuestionScore != null && (
                                            <span className="text-xs font-bold text-slate-600">
                                              {ans.earnedQuestionScore}
                                              <span className="font-normal text-slate-400">/{ans.maxQuestionScore ?? '-'}</span>
                                              {ans.questionWeight != null && (
                                                <span className="ml-1 text-[10px] text-slate-400">({Math.round(ans.questionWeight * 100)}%)</span>
                                              )}
                                            </span>
                                          )}
                                          <span className="text-[11px] text-slate-400 group-open:hidden">펼치기 ▼</span>
                                          <span className="hidden text-[11px] text-slate-400 group-open:inline">접기 ▲</span>
                                        </div>
                                      </summary>
                                      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                                        <p className="text-xs font-medium leading-relaxed text-slate-700">{ans.questionText}</p>
                                        {ans.audioDownloadUrl && (
                                          <div className="rounded-lg bg-slate-50 p-2.5">
                                            <p className="mb-1.5 text-[11px] font-semibold text-slate-500">음성 답변</p>
                                            <audio
                                              controls
                                              src={ans.audioDownloadUrl}
                                              className="h-8 w-full"
                                            />
                                          </div>
                                        )}
                                        {ans.summary && (
                                          <div className="rounded-lg bg-slate-50 p-2.5">
                                            <p className="text-[11px] font-semibold text-slate-500">요약</p>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{ans.summary}</p>
                                          </div>
                                        )}
                                        {(ans.accuracy || ans.depth) && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {ans.accuracy && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">정확도: {ans.accuracy}</span>}
                                            {ans.depth && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">깊이: {ans.depth}</span>}
                                          </div>
                                        )}
                                        {ans.rawStt && (
                                          <div className="rounded-lg bg-slate-50 p-2.5">
                                            <p className="text-[11px] font-semibold text-slate-500">음성 변환 텍스트</p>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{ans.rawStt}</p>
                                          </div>
                                        )}
                                      </div>
                                    </details>
                                  );
                                })}

                                {/* 보안 이상패턴 — 맨 아래, 토글 */}
                                <details className="group rounded-xl border border-slate-200 bg-white">
                                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
                                    <span className="text-sm font-bold text-slate-700">보안 이상패턴</span>
                                    <div className="flex items-center gap-3">
                                      {riskCfg && (
                                        <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${riskCfg.bg} ${riskCfg.text}`}>
                                          <span className={`h-2 w-2 rounded-full ${riskCfg.dot}`} />
                                          {riskCfg.label}
                                        </span>
                                      )}
                                      <span className="text-[11px] text-slate-400 group-open:hidden">펼치기 ▼</span>
                                      <span className="hidden text-[11px] text-slate-400 group-open:inline">접기 ▲</span>
                                    </div>
                                  </summary>
                                  <div className="border-t border-slate-100 px-4 py-3">
                                    {risk ? (
                                      <div className="space-y-1.5">
                                        {risk.items.map((item) => {
                                          const c = RISK_CFG[item.level];
                                          return (
                                            <div key={item.key} className={`flex items-center justify-between rounded-lg px-3 py-2 ${item.level !== 'green' ? c.bg : 'bg-slate-50'}`}>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-slate-600">{item.label}</span>
                                                <span className="text-[10px] text-slate-400">×{item.weight}</span>
                                              </div>
                                              <span className={`text-xs font-bold tabular-nums ${item.level !== 'green' ? c.text : 'text-slate-400'}`}>{item.count}회</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-400">모니터링 데이터 없음</p>
                                    )}
                                  </div>
                                </details>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── 메인 대시보드 ─── */
export default function ProfessorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('students');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cv_prof_token');
    const userData = localStorage.getItem('cv_user');
    if (!token || !userData) { router.push('/professor'); return; }
    setUser(JSON.parse(userData));

    // 과목 로드 or 자동 생성
    getCourses()
      .then(async (courses) => {
        if (courses.length > 0) {
          setCourse(courses[0]);
        } else {
          const now = new Date();
          const month = now.getMonth();
          const semester = month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL';
          const c = await createCourse({ name: 'CodeViva 검증', year: now.getFullYear(), semester });
          setCourse(c);
        }
      })
      .catch(() => router.push('/professor'))
      .finally(() => setInitializing(false));
  }, [router]);

  const logout = () => {
    localStorage.removeItem('cv_prof_token');
    localStorage.removeItem('cv_user');
    router.push('/professor');
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0ee]">
        <p className="text-sm text-slate-400">초기화 중...</p>
      </div>
    );
  }

  const TABS = [
    { id: 'students',    label: '학생 등록' },
    { id: 'assignments', label: '과제 출제' },
    { id: 'results',     label: '결과 조회' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0ee]">
      {/* 네비 — HUFS Navy */}
      <div className="bg-[#002D56] shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-extrabold text-white">
              Code<span className="text-[#6EC6CF]">Viva</span>
            </a>
            {user && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-medium text-blue-100">{user.name} 교수님</span>
            )}
          </div>
          <button onClick={logout} className="text-xs text-blue-200 hover:text-white transition-colors">로그아웃</button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 탭 */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-[#146E7A] text-[#146E7A] bg-white rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          {course && (
            <div className="p-6">
              {tab === 'students'    && <StudentsTab courseId={course.id} />}
              {tab === 'assignments' && <AssignmentsTab courseId={course.id} />}
              {tab === 'results'     && <ResultsTab courseId={course.id} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
