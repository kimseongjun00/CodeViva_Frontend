import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSubmission } from '../../api/submissions';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { syntaxTree } from '@codemirror/language';
import { linter } from '@codemirror/lint';

const LANG_EXTENSIONS = {
  python: () => python(),
  c:      () => cpp(),
  cpp:    () => cpp(),
  java:   () => java(),
};

const syntaxErrorLinter = linter((view) => {
  const diagnostics = [];
  syntaxTree(view.state).cursor().iterate((node) => {
    if (node.type.isError) {
      diagnostics.push({ from: node.from, to: Math.max(node.to, node.from + 1), severity: 'error', message: '문법 오류' });
    }
  });
  return diagnostics;
});

function CodeEditor({ code, onChange, language, viewRef }) {
  const containerRef = useRef(null);
  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => {
    if (!containerRef.current) return;
    const getLang = LANG_EXTENSIONS[language] ?? LANG_EXTENSIONS.python;
    const view = new EditorView({
      state: EditorState.create({
        doc: codeRef.current,
        extensions: [
          basicSetup, getLang(), oneDark, syntaxErrorLinter,
          EditorView.updateListener.of((u) => { if (u.docChanged) onChange(u.state.doc.toString()); }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, monospace' },
            '.cm-content': { padding: '14px' },
          }),
        ],
      }),
      parent: containerRef.current,
    });
    if (viewRef) viewRef.current = view;
    return () => { view.destroy(); if (viewRef) viewRef.current = null; };
  }, [language, onChange]);
  return <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden" />;
}

const GRADES = ['1', '2', '3', '4'];
const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '전기전자공학과', '정보통신공학과',
  '수학과', '물리학과', '경영학과', '기타',
];

const Field = ({ label, required, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const SubmitPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlAssignmentId = searchParams.get('assignmentId') || '';

  const [form, setForm] = useState({
    assignmentId: urlAssignmentId,
    courseName: '',
    studentId: '',
    name: '',
    department: DEPARTMENTS[0],
    grade: '1',
  });
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const editorViewRef = useRef(null);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    if (!form.assignmentId.trim()) return '과제 ID를 입력해주세요.';
    if (!form.courseName.trim()) return '과목명을 입력해주세요.';
    if (!form.studentId.trim()) return '학번을 입력해주세요.';
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!code.trim() && !file) return '코드를 입력하거나 파일을 첨부해주세요.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    if (editorViewRef.current) {
      let hasError = false;
      syntaxTree(editorViewRef.current.state).cursor().iterate((node) => {
        if (node.type.isError) { hasError = true; return false; }
      });
      if (hasError) {
        setError('코드에 문법 오류가 있습니다. 빨간 밑줄 부분을 수정 후 다시 제출해주세요.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await createSubmission({
        assignmentId: Number(form.assignmentId),
        code: code.trim(),
      });

      navigate(`/submit/verify?submissionId=${result.id}&assignmentId=${form.assignmentId}`);
    } catch (err) {
      const status = err?.message;
      if (status === '502') {
        setError('AI 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('제출에 실패했습니다. 과제 ID를 확인해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-3xl font-extrabold tracking-tight text-[#1a6d7e]">
            Code<span className="text-slate-800">Viva</span>
          </div>
          <p className="text-sm text-slate-500">AI 기반 코드 이해도 검증 시스템</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-slate-800">과제 제출</h2>

          <div className="space-y-5">
            {/* 과제 ID */}
            {!urlAssignmentId && (
              <Field label="과제 ID" required>
                <input
                  type="number"
                  placeholder="교수님께 받은 과제 ID"
                  value={form.assignmentId}
                  onChange={set('assignmentId')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none focus:ring-1 focus:ring-[#1a6d7e]"
                />
              </Field>
            )}

            {/* 과목명 */}
            <Field label="과목명" required>
              <input
                type="text"
                placeholder="예) 알고리즘 및 실습"
                value={form.courseName}
                onChange={set('courseName')}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none focus:ring-1 focus:ring-[#1a6d7e]"
              />
            </Field>

            {/* 학번 + 이름 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="학번" required>
                <input
                  type="text"
                  placeholder="예) 20201234"
                  value={form.studentId}
                  onChange={set('studentId')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none focus:ring-1 focus:ring-[#1a6d7e]"
                />
              </Field>
              <Field label="이름" required>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={set('name')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none focus:ring-1 focus:ring-[#1a6d7e]"
                />
              </Field>
            </div>

            {/* 학과 + 학년 */}
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <Field label="학과" required>
                <select
                  value={form.department}
                  onChange={set('department')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="학년" required>
                <select
                  value={form.grade}
                  onChange={set('grade')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#1a6d7e] focus:outline-none"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}학년</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* 코드 입력 */}
            <Field label="제출 코드" required>
              <div className="flex h-72 flex-col overflow-hidden rounded-lg border border-slate-300 focus-within:border-[#1a6d7e] focus-within:ring-1 focus-within:ring-[#1a6d7e]">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500/70" />
                      <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                      <span className="h-2 w-2 rounded-full bg-green-500/70" />
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">solution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{code ? `${code.split('\n').length} lines` : ''}</span>
                    <div className="flex gap-0.5">
                      {[
                        { value: 'python', label: 'Python', active: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
                        { value: 'c',      label: 'C',      active: 'bg-slate-500/30 text-slate-200 border-slate-400/50' },
                        { value: 'cpp',    label: 'C++',    active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
                        { value: 'java',   label: 'Java',   active: 'bg-orange-500/20 text-orange-300 border-orange-500/50' },
                      ].map(({ value, label, active }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLanguage(value)}
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold transition-all ${language === value ? active : 'border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <CodeEditor code={code} onChange={setCode} language={language} viewRef={editorViewRef} />
              </div>
            </Field>

            {/* 파일 첨부 */}
            <Field label="파일 첨부 (선택)">
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <label className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50">
                  파일 선택
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <span className="text-xs text-slate-400">
                  {file ? file.name : '선택된 파일 없음'}
                </span>
              </div>
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">
              제출 후 AI 음성 인터뷰가 진행됩니다.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[#1a6d7e] px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-teal-800 active:scale-95 disabled:opacity-60"
            >
              {submitting ? '제출 중...' : '제출 및 검증 시작 →'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          제출한 코드는 AI 이해도 검증에만 사용됩니다.
        </p>
      </div>
    </div>
  );
};

export default SubmitPage;
