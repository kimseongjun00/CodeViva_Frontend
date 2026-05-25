import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import {
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  evaluateAssignment,
} from '../api/assignments';
import { createSubmission, getSubmissionsByAssignment, getSubmission, evaluateSubmission } from '../api/submissions';
import { saveBatchAnswers, getAnswersBySubmission } from '../api/submissionAnswers';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';
import Pagination from '../components/eclass/Pagination';

const SUB_PAGE_SIZE = 10;

/* ──────────────────────────────────────────────────────────
   공통 레이아웃
────────────────────────────────────────────────────────── */
const EclassPageFrame = ({ role, children }) => {
  const currentPath =
    role === 'instructor' ? '/instructor/assignment-list' : '/student/assignment-list';

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-[400px] w-full bg-gradient-to-b from-[#8a8a8a] via-[#c4c4c4] to-[#efefef]" />
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 pt-14">
        <Header messageCount={0} checkCount={0} bellCount={0} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath={currentPath} />}>{children}</MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   날짜 포맷 헬퍼
────────────────────────────────────────────────────────── */
const formatDateDisplay = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isoToLocalInput = (iso) => {
  if (!iso) return '';
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
};

const localInputToIso = (val) => {
  if (!val) return null;
  return new Date(val).toISOString();
};

const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/* ──────────────────────────────────────────────────────────
   과제 상세 폼 (공통)
────────────────────────────────────────────────────────── */
const AssignmentEditorForm = ({ form, setForm, disabled }) => {
  const handleChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const handleFile = (e) => setForm((p) => ({ ...p, attachmentFile: e.target.files?.[0] ?? null }));

  return (
    <div className="grid grid-cols-[148px_1fr] border-t-2 border-gray-500 text-sm">
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">과제명</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        <input
          className="h-9 w-full rounded-sm border border-gray-300 px-2.5 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          value={form.title}
          onChange={handleChange('title')}
          disabled={disabled}
        />
      </div>

      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">공개일</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        <input
          type="datetime-local"
          className="h-9 w-[240px] rounded-sm border border-gray-300 px-2.5 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          value={form.openAt}
          onChange={handleChange('openAt')}
          disabled={disabled}
        />
      </div>

      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">마감일</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        <input
          type="datetime-local"
          className="h-9 w-[240px] rounded-sm border border-gray-300 px-2.5 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          value={form.dueAt}
          onChange={handleChange('dueAt')}
          disabled={disabled}
        />
      </div>

      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">배점</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        <input
          type="number"
          className="h-9 w-[160px] rounded-sm border border-gray-300 px-2.5 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          value={form.score}
          onChange={handleChange('score')}
          disabled={disabled}
        />
      </div>

      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">과제 설명</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        <textarea
          className="h-[240px] w-full resize-none rounded-sm border border-gray-300 px-2.5 py-2 text-sm leading-6 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.description}
          onChange={handleChange('description')}
          disabled={disabled}
        />
      </div>

      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2.5 font-bold text-gray-700">첨부파일</div>
      <div className="border-b border-gray-300 px-3 py-2.5">
        {form.attachmentOriginalName && !form.removeAttachment && (
          <div className="mb-1.5 flex items-center gap-2 text-sm text-gray-500">
            <span>📎 {form.attachmentOriginalName}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, removeAttachment: true }))}
                className="text-xs text-red-400 hover:text-red-600"
              >
                삭제
              </button>
            )}
          </div>
        )}
        {form.removeAttachment && (
          <div className="mb-1.5 flex items-center gap-2 text-xs text-red-500">
            <span>기존 파일이 삭제됩니다.</span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, removeAttachment: false }))}
              className="text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
          </div>
        )}
        {!disabled && (
          <input
            type="file"
            accept=".pdf"
            className="h-9 w-[320px] rounded-sm border border-gray-300 px-2 py-1 text-sm"
            onChange={handleFile}
          />
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   과제 출제 (강사)
────────────────────────────────────────────────────────── */
export const InstructorAssignmentCreatePage = () => {
  const { selectedCourse } = useCourse();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    openAt: '',
    dueAt: '',
    score: '',
    description: '',
    attachmentFile: null,
    attachmentOriginalName: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedCourse?.id) {
      setError('수강 과목이 선택되지 않았습니다. 과목을 먼저 선택해주세요.');
      return;
    }
    if (!form.title.trim()) {
      setError('과제명을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createAssignment({
        courseId: selectedCourse.id,
        title: form.title,
        openAt: localInputToIso(form.openAt),
        dueAt: localInputToIso(form.dueAt),
        score: form.score ? Number(form.score) : undefined,
        description: form.description,
        attachment: form.attachmentFile,
      });
      navigate('/instructor/assignment-list');
    } catch {
      setError('과제 출제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EclassPageFrame role="instructor">
      <div>
        <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
          <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">과제 출제</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
            <span>›</span>
            <span>{selectedCourse?.name || '과목 미선택'}</span>
            <span>›</span>
            <span className="font-bold text-[#1a6d7e]">과제 출제</span>
          </div>
        </div>

        <div className="rounded border border-[#d3d3d3] bg-white p-5">
          {selectedCourse && (
            <div className="mb-4 rounded border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-700">
              과목: <strong>{selectedCourse.name}</strong> (ID: {selectedCourse.id})
            </div>
          )}
          <AssignmentEditorForm form={form} setForm={setForm} disabled={false} />
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <div className="mt-8 flex justify-end gap-3 border-t border-[#dfdfdf] pt-5">
            <Link
              to="/instructor/assignment-list"
              className="rounded-sm border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-sm bg-[#1a6d7e] px-8 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting ? '출제 중...' : '과제 출제'}
            </button>
          </div>
        </div>
      </div>
    </EclassPageFrame>
  );
};

/* ──────────────────────────────────────────────────────────
   과제 상세 및 제출 현황 (강사)
────────────────────────────────────────────────────────── */
export const InstructorAssignmentDetailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assignmentId = searchParams.get('assignmentId');

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    openAt: '',
    dueAt: '',
    score: '',
    description: '',
    attachmentFile: null,
    attachmentOriginalName: '',
    removeAttachment: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [loadingAnswers, setLoadingAnswers] = useState(new Set());
  const [evalStatus, setEvalStatus] = useState('idle'); // 'idle'|'triggering'|'running'|'done'
  const [evalError, setEvalError] = useState('');
  const evalPollingRef = useRef(null);

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    Promise.all([
      getAssignment(assignmentId),
      getSubmissionsByAssignment(assignmentId),
    ])
      .then(([a, subs]) => {
        setAssignment(a);
        setForm({
          title: a.title ?? '',
          openAt: isoToLocalInput(a.openAt),
          dueAt: isoToLocalInput(a.dueAt),
          score: a.score != null ? String(a.score) : '',
          description: a.description ?? '',
          attachmentFile: null,
          attachmentOriginalName: a.attachmentOriginalName ?? '',
          removeAttachment: false,
        });
        setSubmissions(subs);
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateAssignment({
        id: Number(assignmentId),
        title: form.title,
        openAt: localInputToIso(form.openAt),
        dueAt: localInputToIso(form.dueAt),
        score: form.score ? Number(form.score) : undefined,
        description: form.description,
        attachment: form.attachmentFile,
        removeAttachment: form.removeAttachment || undefined,
      });
      setAssignment(updated);
      setIsEditing(false);
    } catch (err) {
      const status = err?.message;
      if (status === '500') {
        setError('서버 오류가 발생했습니다. 과제 수정 중 백엔드 오류입니다. (500)');
      } else {
        setError('저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('과제를 삭제하시겠습니까?')) return;
    try {
      await deleteAssignment(assignmentId);
      navigate('/instructor/assignment-list');
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const refreshSubmissions = useCallback(async () => {
    try {
      const subs = await getSubmissionsByAssignment(assignmentId);
      setSubmissions(subs);
      return subs;
    } catch { return []; }
  }, [assignmentId]);

  const startEvaluation = useCallback(async () => {
    setEvalStatus('triggering');
    setEvalError('');
    try {
      await evaluateAssignment(assignmentId);
      setEvalStatus('running');
      const poll = async () => {
        const subs = await refreshSubmissions();
        const evaluatable = subs.filter((s) =>
          s.aiValidationStatus === 'AWAITING_EVALUATION' ||
          s.aiValidationStatus === 'EVALUATING' ||
          s.aiValidationStatus === 'EVALUATED' ||
          s.aiValidationStatus === 'EVALUATION_FAILED'
        );
        const allSettled = evaluatable.length > 0 && evaluatable.every(
          (s) => s.aiValidationStatus === 'EVALUATED' || s.aiValidationStatus === 'EVALUATION_FAILED'
        );
        if (allSettled) { setEvalStatus('done'); return; }
        evalPollingRef.current = setTimeout(poll, 10000);
      };
      poll();
    } catch {
      setEvalError('평가 시작에 실패했습니다. 다시 시도해주세요.');
      setEvalStatus('idle');
    }
  }, [assignmentId, refreshSubmissions]);

  useEffect(() => () => clearTimeout(evalPollingRef.current), []);

  const handleDownloadAttachment = () => {
    if (assignment?.attachmentDownloadUrl) window.open(assignment.attachmentDownloadUrl, '_blank');
  };

  const toggleRow = (id) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  const allChecked =
    submissions.length > 0 && selectedRows.length === submissions.length;
  const toggleAll = () =>
    setSelectedRows(allChecked ? [] : submissions.map((s) => s.id));

  if (!assignmentId) {
    return (
      <EclassPageFrame role="instructor">
        <div className="py-12 text-center text-sm text-gray-400">
          과제 ID가 없습니다.{' '}
          <Link to="/instructor/assignment-list" className="text-[#1a6d7e] underline">
            목록으로
          </Link>
        </div>
      </EclassPageFrame>
    );
  }

  if (loading) {
    return (
      <EclassPageFrame role="instructor">
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      </EclassPageFrame>
    );
  }

  return (
    <EclassPageFrame role="instructor">
      <div>
        <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
          <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">과제 상세 및 결과</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
            <span>›</span>
            <span>{assignment?.title || '과제'}</span>
            <span>›</span>
            <Link to="/instructor/assignment-list" className="font-bold text-[#1a6d7e] hover:underline">목록으로</Link>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {/* 탭 */}
        <div className="mb-4 flex border-b border-[#dfdfdf]">
          {['detail', 'dashboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-[#1a6d7e] text-[#1a6d7e] bg-white'
                  : 'text-gray-500 hover:text-[#1a6d7e]'
              }`}
            >
              {tab === 'detail' ? '과제 상세 정보' : `제출 현황 (${submissions.length})`}
            </button>
          ))}
        </div>

        <div className="rounded border border-[#d3d3d3] bg-white overflow-hidden min-h-[500px] flex flex-col">
          {activeTab === 'detail' && (
            <div className="flex flex-1 flex-col p-6 lg:p-8">
              <AssignmentEditorForm form={form} setForm={setForm} disabled={!isEditing} />

              {assignment?.attachmentOriginalName && !isEditing && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleDownloadAttachment}
                    className="text-sm text-[#1a6d7e] hover:underline"
                  >
                    첨부파일 다운로드: {assignment.attachmentOriginalName}
                  </button>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-[#dfdfdf] pt-5">
                <button
                  onClick={handleDelete}
                  className="rounded-sm border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                >
                  과제 삭제
                </button>
                <div className="flex gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 rounded-sm border border-[#1a6d7e]/40 bg-white px-6 py-2 text-sm font-semibold text-[#1a6d7e] hover:bg-teal-50"
                    >
                      내용 수정하기
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setForm((p) => ({ ...p, attachmentFile: null, removeAttachment: false }));
                        }}
                        className="rounded-sm border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-sm bg-[#1a6d7e] px-8 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <SubmissionDashboard
              assignment={assignment}
              submissions={submissions}
              selectedRows={selectedRows}
              allChecked={allChecked}
              toggleRow={toggleRow}
              toggleAll={toggleAll}
              answersMap={answersMap}
              setAnswersMap={setAnswersMap}
              expandedRow={expandedRow}
              setExpandedRow={setExpandedRow}
              loadingAnswers={loadingAnswers}
              setLoadingAnswers={setLoadingAnswers}
              evalStatus={evalStatus}
              evalError={evalError}
              onStartEval={startEvaluation}
              onRefreshSubmissions={refreshSubmissions}
            />
          )}
        </div>
      </div>
    </EclassPageFrame>
  );
};

/* ──────────────────────────────────────────────────────────
   과제 제출 (학생)
────────────────────────────────────────────────────────── */
export const StudentAssignmentSubmitPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assignmentId = searchParams.get('assignmentId');

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!assignmentId) return;
    getAssignment(assignmentId)
      .then(setAssignment)
      .catch(() => setError('과제 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleDownloadAttachment = () => {
    if (assignment?.attachmentDownloadUrl) window.open(assignment.attachmentDownloadUrl, '_blank');
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await createSubmission({
        assignmentId: Number(assignmentId),
        code: code.trim(),
      });
      navigate(`/student/assignment-verify?submissionId=${result.id}&assignmentId=${assignmentId}`);
    } catch (err) {
      const status = err?.message;
      if (status === '502') {
        setError('AI 서버가 현재 응답하지 않습니다. 잠시 후 다시 시도해주세요. (502)');
      } else {
        setError('제출에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignmentId) {
    return (
      <EclassPageFrame role="student">
        <div className="py-12 text-center text-sm text-gray-400">
          과제 ID가 없습니다.{' '}
          <Link to="/student/assignment-list" className="text-[#1a6d7e] underline">
            목록으로
          </Link>
        </div>
      </EclassPageFrame>
    );
  }

  if (loading) {
    return (
      <EclassPageFrame role="student">
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      </EclassPageFrame>
    );
  }

  return (
    <EclassPageFrame role="student">
      <div>
        <div className="mb-4 flex items-end justify-between border-b border-[#dfdfdf] pb-2">
          <h2 className="text-[26px] leading-none font-bold text-[#5a5a5a]">과제 제출</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="rounded-sm bg-[#1a6d7e] px-1 text-[11px] text-white">H</span>
            <span>›</span>
            <Link to="/student/assignment-list" className="text-[#1a6d7e] hover:underline">과제</Link>
            <span>›</span>
            <span className="font-bold text-[#1a6d7e]">과제 제출</span>
          </div>
        </div>

        <div className="flex flex-col rounded border border-[#d3d3d3] bg-white p-4">
          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

          {/* 과제 정보 */}
          {assignment && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">과제명</label>
                <div className="rounded border border-slate-200 bg-[#f3f3f3] px-3 py-2 text-xs font-bold text-[#1a6d7e]">
                  {assignment.title}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">공개일 - 마감일</label>
                  <div className="rounded border border-slate-200 bg-[#f3f3f3] px-3 py-2 text-xs text-[#1a6d7e]">
                    {formatDateDisplay(assignment.openAt)} ~ {formatDateDisplay(assignment.dueAt)}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">배점</label>
                  <div className="rounded border border-slate-200 bg-[#f3f3f3] px-3 py-2 text-xs font-bold text-[#1a6d7e]">
                    {assignment.score != null ? `${assignment.score}점` : '비공개'}
                  </div>
                </div>
              </div>

              {assignment.description && (
                <div className="rounded border border-teal-100 bg-teal-50/50 p-4">
                  <h3 className="mb-2 text-xs font-bold text-teal-800"> 출제 과제 상세 내용</h3>
                  <div className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                    {assignment.description}
                  </div>
                  {assignment.attachmentOriginalName && (
                    <div className="mt-3 flex items-center justify-between border-t border-teal-100/50 pt-3 text-xs text-teal-700">
                      <span className="font-medium">첨부 참조 파일:</span>
                      <button onClick={handleDownloadAttachment} className="flex items-center gap-1 font-bold hover:underline">
                         {assignment.attachmentOriginalName} 다운로드
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 코드 입력 */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              제출 코드 <span className="text-red-500">*</span>
            </label>
            <div className="overflow-hidden rounded border border-slate-700 bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-3 py-2">
                <span className="font-mono text-xs text-slate-400">코드 입력</span>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                </div>
              </div>
              <textarea
                className="h-60 w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-300 focus:outline-none"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// 구현한 코드를 여기에 붙여넣거나 직접 입력하세요"
                spellCheck={false}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#dfdfdf] pt-4">
            <Link
              to="/student/assignment-list"
              className="rounded-sm border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1 rounded-sm bg-[#1a6d7e] px-5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
               {submitting ? '제출 중...' : '제출 및 AI 검증 시작'}
            </button>
          </div>
        </div>
      </div>
    </EclassPageFrame>
  );
};

/* ──────────────────────────────────────────────────────────
   AI 검증 인터뷰 (학생)
────────────────────────────────────────────────────────── */
const MAX_ANSWER_SECONDS = 180;

const MOCK_CODE = `# 최장 증가 부분 수열 (LIS) - DP 풀이

def solution(arr):
    n = len(arr)
    if n == 0:
        return []

    dp   = [1] * n   # dp[i]: arr[i]로 끝나는 LIS 길이
    prev = [-1] * n  # 경로 역추적용

    max_len, max_idx = 1, 0

    for i in range(1, n):
        for j in range(i):
            if arr[j] < arr[i] and dp[j] + 1 > dp[i]:
                dp[i]   = dp[j] + 1
                prev[i] = j
        if dp[i] > max_len:
            max_len = dp[i]
            max_idx = i

    # 역추적으로 실제 수열 복원
    result = []
    idx = max_idx
    while idx != -1:
        result.append(arr[idx])
        idx = prev[idx]

    return result[::-1]


if __name__ == "__main__":
    # 테스트 케이스
    arr1 = [3, 1, 4, 1, 5, 9, 2, 6]
    print(solution(arr1))   # [1, 4, 5, 9]

    arr2 = [5, 4, 3, 2, 1]
    print(solution(arr2))   # [5]  (감소 수열 — 길이 1)

    arr3 = []
    print(solution(arr3))   # []
`;

const MOCK_QUESTIONS = [
  { id: 1, questionText: '제출한 코드에서 가장 중요한 로직을 설명해주세요. 왜 그 방식을 선택했나요?' },
  { id: 2, questionText: '시간 복잡도와 공간 복잡도를 분석해보세요. 최적화할 수 있는 부분이 있나요?' },
  { id: 3, questionText: '예외 상황이나 엣지 케이스를 어떻게 처리했는지 설명해주세요.' },
];

export const StudentAssignmentVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const submissionId = searchParams.get('submissionId');

  const [questions, setQuestions] = useState([]);
  const [submissionCode, setSubmissionCode] = useState(MOCK_CODE);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [securityWarning, setSecurityWarning] = useState('');

  const waveformBars = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const [phase, setPhase] = useState('voice-test');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [answerLockSeconds, setAnswerLockSeconds] = useState(6);
  const [micTestTimer, setMicTestTimer] = useState(60);
  const [sttOn, setSttOn] = useState(false);
  const [waveHeights, setWaveHeights] = useState(() => Array.from({ length: 24 }, () => 10));
  const [micState, setMicState] = useState('loading');
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [answerElapsed, setAnswerElapsed] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [windowFocused, setWindowFocused] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [micMuteCount, setMicMuteCount] = useState(0);
  const [currentSilenceDuration, setCurrentSilenceDuration] = useState(0);
  const [totalSilenceCount, setTotalSilenceCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [cursorOutCount, setCursorOutCount] = useState(0);
  const [devToolsCount, setDevToolsCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const dataArrayRef = useRef(null);
  const prevHeightsRef = useRef(Array.from({ length: 24 }, () => 10));
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedAudiosRef = useRef({});
  const answerTimerRef = useRef(null);
  const answerElapsedRef = useRef(0);
  const questionTimesRef = useRef({});
  const securityLogRef = useRef([]);
  const devToolsCountRef = useRef(0);
  const focusLossCountRef = useRef(0);
  const autoTimeoutRef = useRef(null);
  const fsTransitionRef = useRef(false);
  const sttOnRef = useRef(false);
  const silenceStartRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const silenceMetricsRef = useRef({});
  const codeLineLogRef = useRef([]);   // { t: elapsed, line: number, at: timestamp }
  const lastLoggedLineRef = useRef(null);
  const codePreRef = useRef(null);
  const cursorZoneLogRef = useRef([]);   // { zone, questionIndex, enterAt, exitAt, duration }
  const currentZoneRef = useRef(null);
  const zoneEnterTimeRef = useRef(null);

  // 질문 로드 — QUESTION_GENERATING 상태면 3초마다 폴링
  useEffect(() => {
    if (!submissionId) {
      setQuestions(MOCK_QUESTIONS);
      setLoadingQuestions(false);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const sub = await getSubmission(submissionId);
        if (cancelled) return;
        if (sub.code) setSubmissionCode(sub.code);
        const status = sub.aiValidationStatus;
        if (status === 'QUESTION_GENERATION_FAILED') {
          setLoadError('질문 생성에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
          setLoadingQuestions(false);
          return;
        }
        const qs = sub.prompt1Questions ?? [];
        if (qs.length > 0 || status === 'AWAITING_AUDIO_ANSWERS' || status === 'AWAITING_EVALUATION' || status === 'EVALUATING' || status === 'EVALUATED') {
          setQuestions(qs.length > 0 ? qs : MOCK_QUESTIONS);
          setLoadingQuestions(false);
          return;
        }
        setTimeout(poll, 3000);
      } catch {
        if (!cancelled) {
          setQuestions(MOCK_QUESTIONS);
          setLoadingQuestions(false);
        }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [submissionId]);

  // 보안 — 키보드 단축키 차단 + 복붙 차단 + 탭 전환 감지
  useEffect(() => {
    const blockKeys = (e) => {
      const key = e.key.toLowerCase();
      const isCapture =
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['s', 'i', 'j', 'c'].includes(key)) ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        (e.ctrlKey && ['s', 'p', 'u'].includes(key)) ||
        (e.metaKey && ['s', 'p'].includes(key));
      const isCopyPaste =
        (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(key);

      if (isCapture || isCopyPaste) {
        e.preventDefault();
        e.stopPropagation();
        setSecurityWarning(
          isCopyPaste
            ? '복사/붙여넣기가 차단되었습니다. 이 행위는 기록됩니다.'
            : '화면 캡처가 감지되었습니다. 이 행위는 기록됩니다.',
        );
        setTimeout(() => setSecurityWarning(''), 3500);
      }
    };
    const blockClipboard = (e) => { e.preventDefault(); };
    const blockContext = (e) => e.preventDefault();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((prev) => prev + 1);
        securityLogRef.current.push({ type: 'tab_switch', at: new Date().toISOString() });
        setSecurityWarning('화면 전환이 감지되었습니다. 이 행위는 기록됩니다.');
        setTimeout(() => setSecurityWarning(''), 4000);
      }
    };
    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 전체화면 강제
  useEffect(() => {
    if (phase === 'done') {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      return;
    }
    const requestFS = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    };
    const handleFSChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      // 전환 중 cursor_out false positive 방지
      fsTransitionRef.current = true;
      setTimeout(() => { fsTransitionRef.current = false; }, 600);
      setIsFullscreen(isFull);
      if (!isFull) {
        setFullscreenExitCount((p) => p + 1);
        securityLogRef.current.push({ type: 'fullscreen_exit', at: new Date().toISOString() });
        setSecurityWarning('전체화면 모드를 유지해야 합니다. 인터뷰 중 이탈은 기록됩니다.');
        setTimeout(() => setSecurityWarning(''), 4000);
      }
    };
    requestFS();
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, [phase]);

  // DevTools 감지 (창 크기 휴리스틱, 1초 폴링)
  useEffect(() => {
    if (phase === 'done') return;
    let wasOpen = false;
    const check = () => {
      const isOpen =
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160;
      if (isOpen && !wasOpen) {
        wasOpen = true;
        devToolsCountRef.current += 1;
        setDevToolsCount((p) => p + 1);
        securityLogRef.current.push({ type: 'devtools_open', at: new Date().toISOString() });
        setDevToolsOpen(true);
        setSecurityWarning('개발자 도구가 감지되었습니다. 이 행위는 기록됩니다.');
        setTimeout(() => setSecurityWarning(''), 4000);
      } else if (!isOpen && wasOpen) {
        wasOpen = false;
        setDevToolsOpen(false);
      }
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // 포커스 이탈 감지 (윈도우 blur + 듀얼모니터 커서 이탈)
  useEffect(() => {
    if (phase === 'done') return;

    // 윈도우 blur: 다른 앱 클릭 시 (듀얼모니터 포함)
    const handleBlur = () => {
      setWindowFocused(false);
      focusLossCountRef.current += 1;
      setWindowBlurCount((p) => p + 1);
      securityLogRef.current.push({ type: 'focus_loss', subtype: 'window_blur', at: new Date().toISOString() });
      setSecurityWarning('포커스 이탈이 감지되었습니다. 이 행위는 기록됩니다.');
      setTimeout(() => setSecurityWarning(''), 4000);
    };
    const handleFocus = () => setWindowFocused(true);

    // document mouseleave: 커서가 브라우저 영역 밖으로 나갈 때 (듀얼모니터 이동 포함)
    const handleMouseLeave = (e) => {
      if (phase !== 'question') return;
      if (fsTransitionRef.current) return; // 전체화면 전환 직후 무시
      if (e.relatedTarget === null) {
        focusLossCountRef.current += 1;
        setCursorOutCount((p) => p + 1);
        securityLogRef.current.push({ type: 'focus_loss', subtype: 'cursor_out', at: new Date().toISOString() });
        setSecurityWarning('커서가 화면을 벗어났습니다. 이 행위는 기록됩니다.');
        setTimeout(() => setSecurityWarning(''), 3000);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [phase]);

  // 마이크 셋업
  useEffect(() => {
    const setupMic = async () => {
      try {
        setMicState('loading');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.minDecibels = -95;
        analyser.maxDecibels = -20;
        analyser.smoothingTimeConstant = 0.6;
        analyserRef.current = analyser;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        dataArrayRef.current = dataArray;
        setMicState('ready');

        // 마이크 상태 이상 감지 (음소거 / 연결 끊김 / 권한 해제)
        const track = stream.getAudioTracks()[0];
        if (track) {
          track.addEventListener('mute', () => {
            setMicMuted(true);
            setMicMuteCount((prev) => prev + 1);
            securityLogRef.current.push({ type: 'mic_mute', at: new Date().toISOString() });
            setSecurityWarning('마이크 음소거가 감지되었습니다. 이 행위는 기록됩니다.');
            setTimeout(() => setSecurityWarning(''), 4000);
          });
          track.addEventListener('unmute', () => {
            setMicMuted(false);
            securityLogRef.current.push({ type: 'mic_unmute', at: new Date().toISOString() });
          });
          // 마이크 뽑기 / 권한 해제 → track ended
          track.addEventListener('ended', () => {
            setMicMuted(true);
            setMicMuteCount((prev) => prev + 1);
            setMicState('blocked');
            securityLogRef.current.push({ type: 'mic_disconnected', at: new Date().toISOString() });
            setSecurityWarning('마이크 연결이 끊겼습니다 (제거 또는 권한 해제). 이 행위는 기록됩니다.');
            setTimeout(() => setSecurityWarning(''), 5000);
          });
        }

        const updateWave = () => {
          const node = analyserRef.current;
          const data = dataArrayRef.current;
          if (!node || !data) return;
          node.getByteFrequencyData(data);
          const levels = waveformBars.map((_, i) => {
            const rS = i / waveformBars.length;
            const rE = (i + 1) / waveformBars.length;
            const lS = Math.floor(Math.pow(rS, 1.8) * data.length);
            const lE = Math.max(lS + 1, Math.floor(Math.pow(rE, 1.8) * data.length));
            let sum = 0;
            for (let j = lS; j < lE; j++) sum += data[j] * (1 + j / data.length);
            const avg = sum / Math.max(1, lE - lS);
            const norm = Math.min(1, avg / 255);
            const curve = Math.pow(norm, 0.85);
            const target = 7 + Math.round(curve * 42);
            const prev = prevHeightsRef.current[i] ?? 7;
            const smoothed = target > prev ? prev + (target - prev) * 0.62 : prev - (prev - target) * 0.18;
            prevHeightsRef.current[i] = smoothed;
            return Math.round(smoothed);
          });
          let energySum = 0;
          for (let i = 0; i < data.length; i++) energySum += data[i];
          const isActive = energySum / data.length > 16;
          sttOnRef.current = isActive;
          setSttOn(isActive);
          setWaveHeights(levels);
          rafRef.current = requestAnimationFrame(updateWave);
        };
        rafRef.current = requestAnimationFrame(updateWave);
      } catch {
        setMicState('blocked');
        setSttOn(false);
        setWaveHeights(Array.from({ length: 24 }, () => 8));
      }
    };
    setupMic();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [waveformBars]);

  // 음성 녹음 시작 (question phase 진입 시)
  useEffect(() => {
    if (phase !== 'question' || !streamRef.current) return;
    audioChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // MediaRecorder 미지원 시 무시
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [phase, questionIndex]);

  // voice-test 1분 타이머 → start-countdown
  useEffect(() => {
    if (phase !== 'voice-test') return;
    setMicTestTimer(60);
    const interval = setInterval(() => {
      setMicTestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('start-countdown');
          setCountdown(3);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSkipMicTest = () => {
    setPhase('start-countdown');
    setCountdown(3);
  };

  // 카운트다운
  useEffect(() => {
    if (phase !== 'start-countdown' && phase !== 'next-countdown') return;
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setPhase('question');
          setAnswerLockSeconds(6);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // 최소 답변 잠금 타이머
  useEffect(() => {
    if (phase !== 'question') return;
    const t = setInterval(() => {
      setAnswerLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, questionIndex]);

  // 질문별 답변 경과 시간 측정 + 최대 시간(3분) 강제 종료
  useEffect(() => {
    if (phase !== 'question') {
      clearInterval(answerTimerRef.current);
      return;
    }
    answerElapsedRef.current = 0;
    setAnswerElapsed(0);
    answerTimerRef.current = setInterval(() => {
      answerElapsedRef.current += 1;
      setAnswerElapsed(answerElapsedRef.current);
      if (answerElapsedRef.current >= MAX_ANSWER_SECONDS) {
        clearInterval(answerTimerRef.current);
        autoTimeoutRef.current?.();
      }
    }, 1000);
    return () => clearInterval(answerTimerRef.current);
  }, [phase, questionIndex]);

  // 무음 구간 추적 (1초 폴링, question phase에서만)
  useEffect(() => {
    if (phase !== 'question') {
      silenceStartRef.current = null;
      hasSpokenRef.current = false;
      setCurrentSilenceDuration(0);
      return;
    }

    const id = setInterval(() => {
      const isActive = sttOnRef.current;
      const elapsed = answerElapsedRef.current;
      const qi = questionIndex;

      if (!silenceMetricsRef.current[qi]) {
        silenceMetricsRef.current[qi] = { initialSilence: null, maxSilence: 0, totalSilence: 0, count: 0 };
      }
      const m = silenceMetricsRef.current[qi];

      if (!isActive) {
        if (silenceStartRef.current === null) silenceStartRef.current = elapsed;
        setCurrentSilenceDuration(elapsed - silenceStartRef.current);
      } else {
        if (!hasSpokenRef.current) {
          hasSpokenRef.current = true;
          m.initialSilence = elapsed;
        }
        if (silenceStartRef.current !== null) {
          const duration = elapsed - silenceStartRef.current;
          if (duration >= 3) {
            m.maxSilence = Math.max(m.maxSilence, duration);
            m.totalSilence += duration;
            m.count += 1;
            setTotalSilenceCount((p) => p + 1);
            securityLogRef.current.push({
              type: 'silence_segment',
              questionIndex: qi,
              start: silenceStartRef.current,
              duration,
              at: new Date().toISOString(),
            });
          }
          silenceStartRef.current = null;
        }
        setCurrentSilenceDuration(0);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [phase, questionIndex]);

  // 커서 존 진입 기록
  const handleZoneEnter = useCallback((zone) => {
    if (phase !== 'question') return;
    currentZoneRef.current = zone;
    zoneEnterTimeRef.current = Date.now();
  }, [phase]);

  // 커서 존 이탈 기록
  const handleZoneLeave = useCallback(() => {
    if (!currentZoneRef.current || !zoneEnterTimeRef.current) return;
    const duration = Math.round((Date.now() - zoneEnterTimeRef.current) / 1000);
    if (duration > 0) {
      cursorZoneLogRef.current.push({
        zone: currentZoneRef.current,
        questionIndex,
        duration,
        enterAt: new Date(zoneEnterTimeRef.current).toISOString(),
      });
    }
    currentZoneRef.current = null;
    zoneEnterTimeRef.current = null;
  }, [questionIndex]);

  const submitAllAnswers = useCallback(async () => {
    setSubmitting(true);
    try {
      await saveBatchAnswers({
        submissionId: Number(submissionId),
        questionIds: questions.map((q) => q.id),
        audioFiles: questions.map((_, i) => recordedAudiosRef.current[i] ?? new Blob([], { type: 'audio/webm' })),
      });
    } catch (e) {
      console.error('[CodeViva] 음성 답변 제출 실패:', e?.message, e?.body);
    } finally {
      // 부정행위 로그 콘솔 출력 (백엔드 연동 시 별도 API로 전송)
      console.info('[CodeViva Security Log]', {
        submissionId,
        tabSwitchCount: securityLogRef.current.filter((e) => e.type === 'tab_switch').length,
        devToolsCount: devToolsCountRef.current,
        focusLossCount: focusLossCountRef.current,
        answerTimeouts: securityLogRef.current.filter((e) => e.type === 'answer_timeout').length,
        questionTimes: questionTimesRef.current,
        silenceMetrics: silenceMetricsRef.current,
        cursorZoneLog: cursorZoneLogRef.current,
        codeLineLog: codeLineLogRef.current,
        events: securityLogRef.current,
      });
      setSubmitting(false);
      setPhase('done');
    }
  }, [submissionId, questions]);

  // 최대 답변 시간 초과 시 강제 종료 (answerLockSeconds 무시)
  const handleAnswerTimeout = useCallback(() => {
    questionTimesRef.current[questionIndex] = MAX_ANSWER_SECONDS;
    securityLogRef.current.push({ type: 'answer_timeout', questionIndex, at: new Date().toISOString() });

    const recorder = mediaRecorderRef.current;
    const isLast = questionIndex >= questions.length - 1;

    const finalize = (blob) => {
      recordedAudiosRef.current[questionIndex] = blob;
      if (isLast) {
        submitAllAnswers();
      } else {
        setQuestionIndex((prev) => prev + 1);
        setPhase('next-countdown');
        setCountdown(3);
      }
    };

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        finalize(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      };
      recorder.stop();
    } else {
      finalize(new Blob([], { type: 'audio/webm' }));
    }
  }, [questionIndex, questions.length, submitAllAnswers]);

  // ref를 항상 최신 콜백으로 유지 (타이머 useEffect에서 참조)
  autoTimeoutRef.current = handleAnswerTimeout;

  const handleAnswerComplete = useCallback(() => {
    if (answerLockSeconds > 0) return;

    questionTimesRef.current[questionIndex] = answerElapsedRef.current;

    const recorder = mediaRecorderRef.current;
    const isLast = questionIndex >= questions.length - 1;

    const finalize = (blob) => {
      recordedAudiosRef.current[questionIndex] = blob;
      if (isLast) {
        submitAllAnswers();
      } else {
        setQuestionIndex((prev) => prev + 1);
        setPhase('next-countdown');
        setCountdown(3);
      }
    };

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        finalize(blob);
      };
      recorder.stop();
    } else {
      finalize(new Blob([], { type: 'audio/webm' }));
    }
  }, [answerLockSeconds, questionIndex, questions.length, submitAllAnswers]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
        <p className="mb-2 text-base font-bold text-red-400">오류가 발생했습니다</p>
        <p className="text-sm text-slate-400">{loadError}</p>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900">
        <svg className="mb-4 h-10 w-10 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-base font-bold text-white">AI가 질문을 생성하고 있습니다</p>
        <p className="mt-1 text-sm text-slate-400">제출한 코드를 분석 중입니다. 잠시만 기다려주세요...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-6 px-6" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* 인쇄/PDF 차단 + 스크린샷 시 흐려지는 효과 */}
      <style>{`
        @media print { body { display: none !important; } }
        .secure-content { -webkit-user-select: none; user-select: none; }
      `}</style>

      {/* 스크린샷 방지 오버레이 (mix-blend-mode: difference — 캡처 시 색 반전) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(128,128,128,0.03)',
          mixBlendMode: 'difference',
          pointerEvents: 'none',
        }}
      />

      {/* 전체화면 미진입 오버레이 */}
      {!isFullscreen && phase !== 'done' && (
        <div className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-slate-900/97">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-5xl">
            🔒
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">전체화면 모드 필요</h2>
          <p className="mb-2 max-w-sm text-center text-sm text-slate-400">
            AI 검증 인터뷰는 부정행위 방지를 위해 전체화면에서만 진행됩니다.
          </p>
          {tabSwitchCount > 0 && (
            <p className="mb-6 text-xs font-bold text-red-400">
              탭 이탈 {tabSwitchCount}회 감지됨 — 기록되었습니다.
            </p>
          )}
          <button
            onClick={() => {
              const el = document.documentElement;
              if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
              else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            }}
            className="rounded-xl bg-teal-500 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-teal-400 active:scale-95 transition-all"
          >
            전체화면으로 전환하기
          </button>
        </div>
      )}

      {/* 포커스 이탈 / DevTools 블러 오버레이 */}
      {((!windowFocused || devToolsOpen) && phase !== 'done') && (
        <div className="fixed inset-0 z-[99990] flex flex-col items-center justify-center backdrop-blur-xl bg-slate-900/80">
          <div className="mb-4 text-5xl">{devToolsOpen ? '🔧' : '👁'}</div>
          <h2 className="mb-2 text-xl font-bold text-white">
            {devToolsOpen ? '개발자 도구 감지됨' : '브라우저 포커스 이탈'}
          </h2>
          <p className="text-sm text-slate-400">
            {devToolsOpen
              ? '개발자 도구를 닫으면 인터뷰가 재개됩니다. 이 행위는 기록됩니다.'
              : '이 창을 클릭하면 인터뷰가 재개됩니다. 이 행위는 기록됩니다.'}
          </p>
        </div>
      )}

      {/* 보안 경고 토스트 */}
      {securityWarning && (
        <div className="fixed top-4 left-1/2 z-[99999] -translate-x-1/2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-xl">
          ⚠ {securityWarning}
        </div>
      )}

      <div className="flex w-full max-w-[1100px] h-[1000px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 relative">
        {/* 헤더 */}
        <div className="z-10 shrink-0 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold tracking-tight text-white">AI 검증 인터뷰</h2>
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              보안 모드
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 의심 지표 뱃지 — 0이면 숨김 */}
            {fullscreenExitCount > 0 && (
              <span className="rounded-full bg-red-900/70 px-2.5 py-1 text-[11px] font-bold text-red-300">
                전체화면 해제 {fullscreenExitCount}
              </span>
            )}
            {tabSwitchCount > 0 && (
              <span className="rounded-full bg-red-900/70 px-2.5 py-1 text-[11px] font-bold text-red-300">
                탭 전환 {tabSwitchCount}
              </span>
            )}
            {windowBlurCount > 0 && (
              <span className="rounded-full bg-red-900/70 px-2.5 py-1 text-[11px] font-bold text-red-300">
                앱 전환 {windowBlurCount}
              </span>
            )}
            {cursorOutCount > 0 && (
              <span className="rounded-full bg-orange-900/70 px-2.5 py-1 text-[11px] font-bold text-orange-300">
                커서 이탈 {cursorOutCount}
              </span>
            )}
            {micMuteCount > 0 && (
              <span className="rounded-full bg-red-900/70 px-2.5 py-1 text-[11px] font-bold text-red-300">
                음소거 {micMuteCount}
              </span>
            )}
            {devToolsCount > 0 && (
              <span className="rounded-full bg-yellow-900/70 px-2.5 py-1 text-[11px] font-bold text-yellow-300">
                DevTools {devToolsCount}
              </span>
            )}
            {totalSilenceCount > 0 && (
              <span className="rounded-full bg-orange-900/70 px-2.5 py-1 text-[11px] font-bold text-orange-300">
                무음감지 {totalSilenceCount}
              </span>
            )}
            {currentSilenceDuration >= 5 && (
              <span className="animate-pulse rounded-full bg-red-900/80 px-2.5 py-1 text-[11px] font-bold text-red-300">
                무음 {currentSilenceDuration}초
              </span>
            )}

            {/* 구분선 */}
            <div className="h-4 w-px bg-slate-600" />

            {/* 전체화면 상태 */}
            <button
              onClick={() => {
                const el = document.documentElement;
                if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                isFullscreen ? 'bg-green-900/40 text-green-400' : 'animate-pulse bg-yellow-900/70 text-yellow-300'
              }`}
            >
              {isFullscreen ? '⛶ 전체화면' : '⚠ 전체화면'}
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col p-6">
          {/* 마이크 테스트 */}
          {phase === 'voice-test' && (
            <div className="m-auto w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              {/* 타이틀 + 타이머 */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-teal-100 bg-teal-50">
                    <span className="text-xl">🎙</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">마이크 및 환경 테스트</h3>
                    <p className="text-sm text-slate-500">AI가 질문을 준비하는 동안 마이크를 테스트하세요.</p>
                  </div>
                </div>
                {/* 타이머 원형 */}
                <div className="flex flex-col items-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-teal-100 bg-teal-50">
                    <span className="text-xl font-bold tabular-nums text-teal-600">{micTestTimer}</span>
                  </div>
                  <span className="mt-1 text-xs text-slate-400">초 남음</span>
                </div>
              </div>

              {/* AI 준비 중 안내 */}
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <span className="animate-pulse text-amber-500 text-lg">⚙️</span>
                <p className="text-sm text-amber-700">AI가 제출한 코드를 분석하여 질문을 생성하고 있습니다...</p>
              </div>

              {/* 부정행위 경고 */}
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base">🚨</span>
                  <span className="text-sm font-bold text-red-700">인터뷰 부정행위 안내</span>
                </div>
                <ul className="space-y-1.5 text-xs text-red-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-bold">✕</span>
                    <span><strong>질문을 소리 내어 읽지 마세요.</strong> 녹음된 음성에서 질문 내용이 감지되면 AI 도구 활용으로 간주됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-bold">✕</span>
                    <span>답변 내용이 제출한 코드와 무관하거나 지나치게 정형화된 경우 의심 사례로 분류됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-bold">✕</span>
                    <span>모든 이상 패턴(답변 지연, 읽는 말투, 비자연스러운 발화 등)은 AI가 자동으로 분석합니다.</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-400">테스트 멘트</div>
                  <div className="text-sm font-medium text-slate-700">"테스트 멘트를 읽어주세요"</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-400">연결 상태</div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${micState === 'ready' ? 'bg-green-500' : micState === 'blocked' ? 'bg-red-500' : 'animate-pulse bg-yellow-400'}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {micState === 'loading' && '마이크 확인 중...'}
                      {micState === 'ready' && '마이크 준비 완료'}
                      {micState === 'blocked' && '마이크 권한 필요'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative mb-6 flex h-28 items-end justify-center overflow-hidden rounded-xl bg-slate-900 p-5">
                <div className="z-10 flex h-16 w-full items-end justify-center gap-1">
                  {waveformBars.map((bar, i) => (
                    <span
                      key={bar}
                      className="w-1.5 rounded-t-sm transition-all duration-75"
                      style={{
                        height: `${waveHeights[i] ?? 2}px`,
                        backgroundColor: sttOn ? '#2dd4bf' : '#64748b',
                        opacity: sttOn ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#2dd4bf]/20 to-transparent opacity-50" />
              </div>

              {/* 다음 버튼 */}
              <button
                onClick={handleSkipMicTest}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition-all"
              >
                질문 준비 완료 — 인터뷰 시작
              </button>
            </div>
          )}

          {/* 카운트다운 */}
          {(phase === 'start-countdown' || phase === 'next-countdown') && (
            <div className="m-auto flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-lg font-medium text-teal-600">
                {phase === 'start-countdown' ? '인터뷰가 곧 시작됩니다' : '다음 질문을 준비하세요'}
              </div>
              <div className="text-9xl font-extrabold tabular-nums tracking-tighter text-slate-800 drop-shadow-sm">
                {countdown}
              </div>
            </div>
          )}

          {/* 질문 */}
          {phase === 'question' && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1.3fr_1fr]">
                {/* 질문 정보 */}
                <div
                  className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  onMouseEnter={() => handleZoneEnter('question')}
                  onMouseLeave={handleZoneLeave}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-base font-bold text-teal-700">
                        Q{questionIndex + 1}
                      </div>
                      <span className="text-base font-semibold text-slate-700">
                        AI 면접관의 질문 ({questionIndex + 1}/{questions.length})
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-500">
                      질문을 소리 내어 읽지 마세요
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <LensMaskedText lensRadius={160}>
                      <p className="text-2xl font-medium leading-relaxed text-slate-800">
                        {questions[questionIndex]?.questionText}
                      </p>
                    </LensMaskedText>
                    <p className="mt-3 text-xs text-slate-400">마우스를 올려 질문을 확인하세요</p>
                    <div className="mt-auto pt-4">
                      <div className="flex gap-1">
                        {questions.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${i < questionIndex ? 'bg-teal-400' : i === questionIndex ? 'bg-teal-600' : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 제출 코드 에디터 */}
                <div
                  className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-sm"
                  onMouseEnter={() => handleZoneEnter('code')}
                  onMouseLeave={handleZoneLeave}
                >
                  <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-5 py-3">
                    <span className="font-mono text-sm text-slate-400">제출한 코드</span>
                    <div className="flex gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-red-500/70" />
                      <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                      <span className="h-3 w-3 rounded-full bg-green-500/70" />
                    </div>
                  </div>
                  <pre
                    ref={codePreRef}
                    onMouseMove={(e) => {
                      if (phase !== 'question' || !codePreRef.current) return;
                      const rect = codePreRef.current.getBoundingClientRect();
                      const relY = e.clientY - rect.top + codePreRef.current.scrollTop;
                      const lineHeight = codePreRef.current.scrollHeight /
                        Math.max(1, codePreRef.current.textContent.split('\n').length);
                      const line = Math.max(1, Math.floor(relY / lineHeight) + 1);
                      if (line !== lastLoggedLineRef.current) {
                        lastLoggedLineRef.current = line;
                        codeLineLogRef.current.push({
                          t: answerElapsedRef.current,
                          line,
                          questionIndex,
                          at: new Date().toISOString(),
                        });
                      }
                    }}
                    className="min-h-0 flex-1 overflow-y-auto p-5 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap"
                  >{submissionCode}</pre>
                </div>
              </div>

              {/* 음소거 감지 경고 배너 */}
              {micMuted && (
                <div className="mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                  <span className="animate-pulse text-red-500">🔇</span>
                  <p className="text-xs font-bold text-red-600">
                    마이크 음소거 감지됨 — 답변 시간이 계속 소모됩니다. 음소거 이력은 기록됩니다.
                  </p>
                </div>
              )}

              {/* 액션 바 (파형 + 경과 시간 포함) */}
              <div className={`flex shrink-0 items-center justify-between rounded-2xl border p-5 shadow-sm ${micMuted ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${micMuted ? 'bg-red-100 text-red-500' : sttOn ? 'animate-pulse bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                    {micMuted ? '🔇' : '🎙'}
                  </div>
                  <div>
                    <div className="mb-1 text-sm font-bold text-slate-800">
                      {micMuted ? '마이크 음소거 중 — 기록됨' : micState === 'blocked' ? '마이크 권한 필요' : sttOn ? '답변을 듣고 있습니다...' : '답변 시작을 대기 중'}
                    </div>
                    {currentSilenceDuration >= 5 && !micMuted && (
                      <div className={`text-xs font-bold ${currentSilenceDuration >= 10 ? 'text-red-500' : 'text-amber-500'}`}>
                        무음 {currentSilenceDuration}초 지속 중
                      </div>
                    )}
                    <div className="flex h-6 items-end gap-[2px]">
                      {waveformBars.map((bar, i) => (
                        <span
                          key={bar}
                          className="w-1 rounded-full transition-all duration-75"
                          style={{
                            height: `${sttOn ? Math.max(4, waveHeights[i] / 2) : 4}px`,
                            backgroundColor: sttOn ? '#0d9488' : '#cbd5e1',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 경과 시간 + 제한 시간 */}
                <div className="flex flex-col items-center mx-4 min-w-[90px]">
                  <div className={`tabular-nums text-2xl font-extrabold tracking-tight ${answerElapsed >= MAX_ANSWER_SECONDS - 30 ? 'text-red-500 animate-pulse' : answerElapsed >= MAX_ANSWER_SECONDS - 60 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {fmtTime(answerElapsed)}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {answerElapsed >= MAX_ANSWER_SECONDS - 30
                      ? `${MAX_ANSWER_SECONDS - answerElapsed}초 후 자동 종료`
                      : `최대 ${fmtTime(MAX_ANSWER_SECONDS)}`}
                  </div>
                  {/* 시간 진행 바 */}
                  <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${answerElapsed >= MAX_ANSWER_SECONDS - 30 ? 'bg-red-500' : answerElapsed >= MAX_ANSWER_SECONDS - 60 ? 'bg-amber-400' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, (answerElapsed / MAX_ANSWER_SECONDS) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAnswerComplete}
                  disabled={answerLockSeconds > 0}
                  className={`rounded-xl px-8 py-3.5 text-base font-bold transition-all ${answerLockSeconds > 0 ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-md hover:bg-slate-800 active:scale-95'}`}
                >
                  {answerLockSeconds > 0 ? `답변 완료 (${answerLockSeconds}s 최소)` : '답변 완료 및 다음'}
                </button>
              </div>
            </div>
          )}

          {/* 제출 중 */}
          {phase === 'submitting' && (
            <div className="m-auto flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-4xl">⏳</div>
              <p className="text-lg font-bold text-slate-800">답변을 제출하고 있습니다...</p>
            </div>
          )}

          {/* 완료 */}
          {phase === 'done' && (
            <div className="m-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                <span className="text-4xl"></span>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-slate-800">검증이 완료되었습니다</h3>
              <p className="mb-4 leading-relaxed text-slate-500">
                수고하셨습니다. 모든 답변이 정상적으로 서버에 기록되었습니다.
              </p>
              {/* 보안 로그 요약 */}
              {(() => {
                const timeouts = securityLogRef.current.filter((e) => e.type === 'answer_timeout').length;
                const hasEvents = tabSwitchCount > 0 || devToolsCount > 0 || windowBlurCount > 0 || cursorOutCount > 0 || timeouts > 0 || micMuteCount > 0 || fullscreenExitCount > 0;
                return hasEvents ? (
                  <div className="mb-5 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-xs text-red-700">
                    <div className="mb-2 font-bold text-red-800">보안 이벤트 기록</div>
                    <div className="space-y-1">
                      {fullscreenExitCount > 0 && <div className="flex justify-between"><span>전체화면 해제</span><span className="font-bold">{fullscreenExitCount}회</span></div>}
                      {tabSwitchCount > 0 && <div className="flex justify-between"><span>탭 전환</span><span className="font-bold">{tabSwitchCount}회</span></div>}
                      {windowBlurCount > 0 && <div className="flex justify-between"><span>창 포커스 이탈 (앱 전환)</span><span className="font-bold">{windowBlurCount}회</span></div>}
                      {cursorOutCount > 0 && <div className="flex justify-between"><span>커서 화면 이탈 (듀얼모니터 의심)</span><span className="font-bold">{cursorOutCount}회</span></div>}
                      {micMuteCount > 0 && <div className="flex justify-between"><span>마이크 음소거</span><span className="font-bold">{micMuteCount}회</span></div>}
                      {devToolsCount > 0 && <div className="flex justify-between"><span>개발자 도구 감지</span><span className="font-bold">{devToolsCount}회</span></div>}
                      {timeouts > 0 && <div className="flex justify-between"><span>시간 초과 자동 종료</span><span className="font-bold">{timeouts}회</span></div>}
                    </div>
                  </div>
                ) : null;
              })()}
              {/* 무음 구간 분석 */}
              {Object.keys(silenceMetricsRef.current).length > 0 && (
                <div className="mb-5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600">
                  <div className="mb-2 font-bold text-slate-700">무음 구간 분석</div>
                  {Object.entries(silenceMetricsRef.current).map(([qi, m]) => (
                    <div key={qi} className="mb-2">
                      <div className="mb-1 font-semibold text-slate-500">Q{Number(qi) + 1}</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pl-2">
                        <span>첫 발화까지</span>
                        <span className={`font-mono font-bold ${m.initialSilence > 10 ? 'text-red-500' : 'text-slate-700'}`}>
                          {m.initialSilence ?? 0}초
                        </span>
                        <span>최대 연속 무음</span>
                        <span className={`font-mono font-bold ${m.maxSilence >= 10 ? 'text-red-500' : m.maxSilence >= 5 ? 'text-amber-500' : 'text-slate-700'}`}>
                          {m.maxSilence}초
                        </span>
                        <span>총 무음 시간</span>
                        <span className="font-mono font-bold text-slate-700">{m.totalSilence}초</span>
                        <span>무음 구간 횟수 (3초↑)</span>
                        <span className={`font-mono font-bold ${m.count >= 3 ? 'text-red-500' : 'text-slate-700'}`}>
                          {m.count}회
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 커서 존 분석 */}
              {cursorZoneLogRef.current.length > 0 && (() => {
                const byQ = {};
                cursorZoneLogRef.current.forEach(({ zone, questionIndex: qi, duration }) => {
                  if (!byQ[qi]) byQ[qi] = { question: 0, code: 0 };
                  byQ[qi][zone] = (byQ[qi][zone] || 0) + duration;
                });
                return (
                  <div className="mb-5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600">
                    <div className="mb-2 font-bold text-slate-700">커서 체류 분석</div>
                    {Object.entries(byQ).map(([qi, times]) => (
                      <div key={qi} className="mb-1.5">
                        <div className="mb-0.5 font-semibold text-slate-500">Q{Number(qi) + 1}</div>
                        <div className="flex gap-4 pl-2">
                          <span>질문 열람 <strong className={times.question < 5 ? 'text-red-500' : 'text-teal-600'}>{times.question ?? 0}초</strong></span>
                          <span>코드 확인 <strong className="text-slate-700">{times.code ?? 0}초</strong></span>
                        </div>
                      </div>
                    ))}
                    <p className="mt-2 text-[10px] text-slate-400">질문 열람 시간이 5초 미만이면 빨간색으로 표시됩니다.</p>
                  </div>
                );
              })()}

              {/* 질문별 소요 시간 */}
              {Object.keys(questionTimesRef.current).length > 0 && (
                <div className="mb-5 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-xs text-slate-600">
                  <div className="mb-2 font-bold text-slate-700">질문별 답변 시간</div>
                  {Object.entries(questionTimesRef.current).map(([idx, sec]) => {
                    const isTimeout = sec >= MAX_ANSWER_SECONDS;
                    return (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span>Q{Number(idx) + 1}</span>
                        <span className={`font-mono font-bold ${isTimeout ? 'text-red-500' : ''}`}>
                          {fmtTime(sec)}{isTimeout ? ' (시간초과)' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <Link
                to="/student/assignment-list"
                className="block w-full rounded-xl bg-slate-900 py-3.5 text-center font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-95"
              >
                과제 목록으로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   렌즈 마스킹 컴포넌트
────────────────────────────────────────────────────────── */
const LensMaskedText = ({ children, lensRadius = 90 }) => {
  const [pos, setPos] = React.useState({ x: -999, y: -999 });
  const containerRef = React.useRef(null);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos({ x: -999, y: -999 })}
    >
      {/* 블러 레이어 */}
      <div style={{ filter: 'blur(9px)', userSelect: 'none', pointerEvents: 'none' }}>
        {children}
      </div>
      {/* 렌즈 (커서 위치만 선명하게) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `circle(${lensRadius}px at ${pos.x}px ${pos.y}px)`,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
      {/* 렌즈 테두리 효과 */}
      {pos.x > 0 && (
        <div
          className="pointer-events-none absolute rounded-full border border-teal-400/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
          style={{
            width: lensRadius * 2,
            height: lensRadius * 2,
            left: pos.x - lensRadius,
            top: pos.y - lensRadius,
          }}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   제출 현황 대시보드 (교수용)
────────────────────────────────────────────────────────── */
const GRADE_CONFIG = {
  GRADE_1: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', ring: 'ring-emerald-300', label: '1등급', desc: '최우수' },
  GRADE_2: { bg: 'bg-sky-100',     text: 'text-sky-700',     bar: 'bg-sky-500',     ring: 'ring-sky-300',     label: '2등급', desc: '우수'   },
  GRADE_3: { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500',   ring: 'ring-amber-300',   label: '3등급', desc: '보통'   },
  GRADE_4: { bg: 'bg-orange-100',  text: 'text-orange-700',  bar: 'bg-orange-500',  ring: 'ring-orange-300',  label: '4등급', desc: '미흡'   },
  GRADE_5: { bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-500',     ring: 'ring-red-300',     label: '5등급', desc: '최하'   },
};

const GRADE_ORDER = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5'];

const getGradeConfig = (grade) =>
  GRADE_CONFIG[grade] || { bg: 'bg-slate-100', text: 'text-slate-400', bar: 'bg-slate-300', ring: 'ring-slate-200', label: '—', desc: '평가 대기' };

// 문항별 level 뱃지 (E/G/B/M)
const LEVEL_BADGE = {
  excellent: { bg: 'bg-emerald-500', text: 'text-white', letter: 'E' },
  great:     { bg: 'bg-sky-500',     text: 'text-white', letter: 'G' },
  good:      { bg: 'bg-yellow-400',  text: 'text-white', letter: 'G' },
  bad:       { bg: 'bg-orange-500',  text: 'text-white', letter: 'B' },
  miss:      { bg: 'bg-red-500',     text: 'text-white', letter: 'M' },
};

// 보안 이상패턴 계산
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
  if (sub.tabSwitchCount == null) return null;
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

const EVAL_STATUS_BADGE = {
  AWAITING_EVALUATION:       { label: '평가 대기',    cls: 'bg-blue-50 text-blue-600' },
  EVALUATING:                { label: '평가 중',      cls: 'bg-blue-100 text-blue-700' },
  EVALUATED:                 { label: '평가 완료',    cls: 'bg-emerald-50 text-emerald-600' },
  EVALUATION_FAILED:         { label: '평가 실패',    cls: 'bg-red-50 text-red-500' },
  AWAITING_AUDIO_ANSWERS:    { label: '음성 대기',    cls: 'bg-amber-50 text-amber-600' },
  QUESTION_GENERATING:       { label: '질문 생성 중', cls: 'bg-slate-100 text-slate-500' },
  QUESTION_GENERATION_FAILED:{ label: '질문 실패',    cls: 'bg-red-50 text-red-400' },
};
const getEvalBadge = (status) => EVAL_STATUS_BADGE[status] || { label: '미제출', cls: 'bg-slate-100 text-slate-400' };

const SubmissionDashboard = ({
  assignment, submissions, selectedRows, allChecked, toggleRow, toggleAll,
  answersMap, setAnswersMap, expandedRow, setExpandedRow, loadingAnswers, setLoadingAnswers,
  evalStatus, evalError, onStartEval, onRefreshSubmissions,
}) => {
  const [subPage, setSubPage] = useState(1);

  const handleToggleRow = async (subId) => {
    if (expandedRow === subId) { setExpandedRow(null); return; }
    setExpandedRow(subId);
    if (answersMap[subId] !== undefined) return;
    setLoadingAnswers((prev) => new Set([...prev, subId]));
    try {
      const data = await getAnswersBySubmission(subId);
      setAnswersMap((prev) => ({ ...prev, [subId]: Array.isArray(data) ? data : [] }));
    } catch {
      setAnswersMap((prev) => ({ ...prev, [subId]: [] }));
    } finally {
      setLoadingAnswers((prev) => { const next = new Set(prev); next.delete(subId); return next; });
    }
  };

  // 문항별 등급을 바로 표시하기 위해 submissions 로드 시 전체 답변 선패치
  useEffect(() => {
    submissions.forEach((sub) => {
      if (answersMap[sub.id] !== undefined) return;
      setLoadingAnswers((prev) => new Set([...prev, sub.id]));
      getAnswersBySubmission(sub.id)
        .then((data) => setAnswersMap((prev) => ({ ...prev, [sub.id]: Array.isArray(data) ? data : [] })))
        .catch(() => setAnswersMap((prev) => ({ ...prev, [sub.id]: [] })))
        .finally(() => setLoadingAnswers((prev) => { const next = new Set(prev); next.delete(sub.id); return next; }));
    });
  }, [submissions]); // eslint-disable-line react-hooks/exhaustive-deps

  const gradeCounts = { GRADE_1: 0, GRADE_2: 0, GRADE_3: 0, GRADE_4: 0, GRADE_5: 0 };
  let verifiedCount = 0;
  submissions.forEach((sub) => {
    if (sub.aiValidationStatus === 'EVALUATED') {
      verifiedCount++;
      if (sub.grade && gradeCounts[sub.grade] !== undefined) gradeCounts[sub.grade]++;
    }
  });

  const maxGradeCount = Math.max(...Object.values(gradeCounts), 1);

  const readyCount = submissions.filter((s) =>
    s.aiValidationStatus === 'AWAITING_EVALUATION' || s.aiValidationStatus === 'EVALUATING'
  ).length;
  const evaluatedCount = submissions.filter((s) => s.aiValidationStatus === 'EVALUATED').length;
  const failedCount = submissions.filter((s) => s.aiValidationStatus === 'EVALUATION_FAILED').length;
  const canTrigger = evalStatus === 'idle' || evalStatus === 'done';

  return (
    <div className="p-3 sm:p-4">
      {/* 이해도 평가 트리거 배너 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <div className="text-xs font-bold text-slate-700">AI 이해도 평가</div>
          <div className="mt-0.5 text-[11px] text-slate-400">
            음성 인터뷰를 완료한 학생들의 이해도를 일괄 평가합니다 (배치, 최대 2시간 소요).
          </div>
          {evalError && <div className="mt-1 text-[11px] font-semibold text-red-500">{evalError}</div>}
        </div>
        <div className="flex items-center gap-3">
          {(evalStatus === 'running' || evalStatus === 'done') && submissions.length > 0 && (
            <div className="min-w-[120px]">
              <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                <span>평가 완료</span>
                <span className="font-bold">{evaluatedCount + failedCount} / {submissions.length}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#1a6d7e] transition-all duration-700"
                  style={{ width: `${submissions.length ? ((evaluatedCount + failedCount) / submissions.length) * 100 : 0}%` }}
                />
              </div>
              {failedCount > 0 && (
                <div className="mt-0.5 text-[10px] text-red-400">실패 {failedCount}건 포함</div>
              )}
            </div>
          )}
          {evalStatus === 'done' && (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              평가 완료
            </span>
          )}
          {evalStatus === 'running' && (
            <div className="flex items-center gap-1 text-[11px] text-blue-600">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              평가 진행 중
            </div>
          )}
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onStartEval}
              disabled={!canTrigger || readyCount === 0}
              className="rounded bg-[#1a6d7e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {evalStatus === 'triggering' ? '시작 중...' : evalStatus === 'running' ? '평가 중...' : '이해도 평가 시작'}
            </button>
            {readyCount === 0 && canTrigger && (
              <span className="text-[10px] text-slate-400">평가 대기 중인 제출이 없습니다</span>
            )}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">총 제출</div>
          <div className="flex items-baseline gap-1">
            <div className="text-xl font-extrabold text-slate-800">{submissions.length}</div>
            <div className="text-[11px] text-slate-400">명</div>
          </div>
        </div>
        <div className="rounded border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-3 shadow-sm">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-400">검증 완료</div>
          <div className="flex items-baseline gap-1">
            <div className="text-xl font-extrabold text-teal-700">{verifiedCount}</div>
            <div className="text-[11px] text-teal-400">명</div>
          </div>
        </div>
        <div className="col-span-2 rounded border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">검증 결과 분포</div>
          <div className="flex items-end gap-2 h-10">
            {GRADE_ORDER.map((grade) => {
              const cfg = GRADE_CONFIG[grade];
              const cnt = gradeCounts[grade];
              return (
                <div key={grade} className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-[10px] text-slate-400">{cnt}명</span>
                  <div
                    className={`w-full rounded-t transition-all ${cfg.bar}`}
                    style={{ height: `${Math.max(3, (cnt / maxGradeCount) * 24)}px` }}
                  />
                  <span className={`text-[10px] font-extrabold ${cfg.text}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 제출 목록 */}
      <div className="overflow-x-auto rounded border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-[#f3f3f3]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded accent-teal-600" />
              </th>
              <th className="px-3 py-2 font-semibold text-slate-600">학생</th>
              <th className="hidden px-3 py-2 font-semibold text-slate-600 sm:table-cell">제출일시</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-600">상태</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-600">평균 등급</th>
              <th className="hidden px-3 py-2 text-center font-semibold text-slate-600 md:table-cell">문항별 등급</th>
              <th className="hidden px-3 py-2 text-center font-semibold text-slate-600 lg:table-cell">이상패턴</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-600">상세 보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(() => {
              const pagedSubs = submissions.slice((subPage-1)*SUB_PAGE_SIZE, subPage*SUB_PAGE_SIZE);
              return submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <span className="text-4xl"></span>
                    <span className="text-sm">아직 제출된 과제가 없습니다</span>
                  </div>
                </td>
              </tr>
            ) : (
              pagedSubs.map((sub) => {
                const answers = answersMap[sub.id];
                const isLoading = loadingAnswers.has(sub.id);
                const gradeCfg = sub.grade ? getGradeConfig(sub.grade) : null;
                const isExpanded = expandedRow === sub.id;
                const risk = computeSecurityRisk(sub);
                const riskCfg = risk ? RISK_CFG[risk.overall] : null;
                const sortedAnswers = answers ? [...answers].sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0)) : [];

                return (
                  <React.Fragment key={sub.id}>
                    <tr className={`transition-colors ${isExpanded ? 'bg-teal-50/40' : 'hover:bg-slate-50/60'}`}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(sub.id)}
                          onChange={() => toggleRow(sub.id)}
                          className="rounded accent-teal-600"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{sub.userName || '(이름 없음)'}</div>
                        <div className="text-xs text-slate-400">{sub.userId}</div>
                      </td>
                      <td className="hidden px-3 py-2 text-xs text-slate-500 sm:table-cell">
                        {formatDateDisplay(sub.createdAt)}
                      </td>
                      {/* 상태 */}
                      <td className="px-3 py-2 text-center">
                        {(() => {
                          const badge = getEvalBadge(sub.aiValidationStatus);
                          const isEvaluating = sub.aiValidationStatus === 'EVALUATING';
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                              {isEvaluating && (
                                <svg className="h-2.5 w-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              )}
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      {/* 평균 등급 */}
                      <td className="px-3 py-2 text-center">
                        {gradeCfg ? (
                          <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold ${gradeCfg.bg} ${gradeCfg.text}`}>
                            {gradeCfg.label}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      {/* 문항별 등급 */}
                      <td className="hidden px-3 py-2 text-center md:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          {[0, 1, 2].map((qi) => {
                            const lv = sortedAnswers[qi]?.level?.toLowerCase();
                            const cfg = lv ? (LEVEL_BADGE[lv] ?? null) : null;
                            return cfg ? (
                              <span key={qi} title={lv}
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${cfg.bg} ${cfg.text}`}>
                                {cfg.letter}
                              </span>
                            ) : (
                              <span key={qi} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-400">—</span>
                            );
                          })}
                        </div>
                      </td>
                      {/* 이상패턴 */}
                      <td className="hidden px-3 py-2 text-center lg:table-cell">
                        {riskCfg ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${riskCfg.bg} ${riskCfg.text}`}>
                            <span className={`h-2 w-2 rounded-full ${riskCfg.dot}`} />
                            {riskCfg.label}
                          </span>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleToggleRow(sub.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            isExpanded
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-slate-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isLoading ? '로딩...' : isExpanded ? '닫기 ▲' : '상세 ▼'}
                        </button>
                      </td>
                    </tr>

                    {/* 검증 상세 펼침 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="bg-gradient-to-b from-teal-50/60 to-white px-6 pb-5 pt-2">
                          <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
                              <div className="font-semibold text-slate-700">{sub.userName} 검증 결과</div>
                              {gradeCfg && (
                                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${gradeCfg.bg} ${gradeCfg.text}`}>
                                  {gradeCfg.label} · {gradeCfg.desc}
                                </span>
                              )}
                            </div>

                            {!answers || answers.length === 0 ? (
                              <div className="flex flex-col items-center gap-2 py-6 text-center text-slate-400">
                                <span className="text-3xl">🎤</span>
                                <span className="text-sm">
                                  {answers === undefined ? '검증 데이터를 불러오는 중...' : '음성 검증 답변 데이터가 없습니다.'}
                                </span>
                              </div>
                            ) : (
                              <>
                                {/* 문항별 답변 */}
                                {sortedAnswers.map((ans, idx) => {
                                  const lv = ans.level?.toLowerCase();
                                  const lvBadge = lv ? (LEVEL_BADGE[lv] ?? null) : null;
                                  return (
                                    <details key={ans.id ?? idx} className="group rounded-xl border border-slate-200 bg-white">
                                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
                                        <div className="flex items-center gap-2 min-w-0">
                                          {lvBadge ? (
                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${lvBadge.bg} ${lvBadge.text}`}>{lvBadge.letter}</span>
                                          ) : (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">Q{ans.questionOrder ?? idx + 1}</span>
                                          )}
                                          <span className="text-sm font-bold text-slate-700">Q{ans.questionOrder ?? idx + 1}</span>
                                          <span className="text-xs text-slate-500 line-clamp-1 max-w-xs">{ans.questionText}</span>
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
                                            <audio controls src={ans.audioDownloadUrl} className="h-8 w-full" />
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

                                {/* 보안 이상패턴 */}
                                <details className="group rounded-xl border border-slate-200 bg-white">
                                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none">
                                    <span className="text-sm font-bold text-slate-700">보안 이상패턴</span>
                                    <div className="flex items-center gap-3">
                                      {riskCfg && (
                                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${riskCfg.bg} ${riskCfg.text}`}>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            );
          })()}
          </tbody>
        </table>
        <Pagination currentPage={subPage} totalPages={Math.ceil(submissions.length/SUB_PAGE_SIZE)} onPageChange={setSubPage} />
      </div>
    </div>
  );
};
