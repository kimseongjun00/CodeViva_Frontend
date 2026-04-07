import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/eclass/Header';
import GlobalNav from '../components/eclass/GlobalNav';
import MainLayout from '../components/eclass/MainLayout';
import Sidebar from '../components/eclass/Sidebar';
import Footer from '../components/eclass/Footer';
import ScrollUpButton from '../components/eclass/ScrollUpButton';

const EclassPageFrame = ({ role, children }) => {
  const [messageCount, setMessageCount] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [bellCount, setBellCount] = useState(0);
  const currentPath = role === 'instructor' ? '/instructor/assignment-list' : '/student/assignment-list';

  useEffect(() => {
    const fetchHeaderCounts = async () => {
      const getMessages = new Promise((resolve) => {
        setTimeout(() => resolve(4), 180);
      });
      const getNotices = new Promise((resolve) => {
        setTimeout(() => resolve({ check: 4, bell: 6 }), 250);
      });
      const [messages, notices] = await Promise.all([getMessages, getNotices]);
      setMessageCount(messages);
      setCheckCount(notices.check);
      setBellCount(notices.bell);
    };
    fetchHeaderCounts();
  }, []);

  return (
    <div className="min-h-screen bg-[#efefef] font-['malgun_gothic','Apple_SD_Gothic_Neo',arial,sans-serif] text-[12px] leading-[17px] text-[#666666]">
      <div className="absolute top-0 left-0 z-0 h-36 w-full bg-gradient-to-b from-[#767676] to-[#a7a7a7]" />
      <div className="relative z-10 mx-auto w-[980px] pt-7">
        <Header messageCount={messageCount} checkCount={checkCount} bellCount={bellCount} />
        <GlobalNav />
        <MainLayout sidebar={<Sidebar currentPath={currentPath} />}>{children}</MainLayout>
        <Footer />
      </div>
      <ScrollUpButton />
    </div>
  );
};

const AssignmentEditorForm = ({ form, setForm, disabled }) => {
  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  return (
    <div className="grid grid-cols-[118px_1fr] border-t-2 border-gray-500 text-xs">
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">과제명</div>
      <div className="border-b border-gray-300 px-3 py-2">
        <input
          className="h-8 w-full border border-gray-300 px-2.5 py-1 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.title}
          onChange={handleChange('title')}
          disabled={disabled}
        />
      </div>
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">공개일</div>
      <div className="flex items-center gap-2 border-b border-gray-300 px-3 py-2">
        <input
          className="h-8 w-[220px] border border-gray-300 px-2.5 py-1 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.openDate}
          onChange={handleChange('openDate')}
          disabled={disabled}
        />
      </div>
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">마감일</div>
      <div className="flex items-center gap-2 border-b border-gray-300 px-3 py-2">
        <input
          className="h-8 w-[220px] border border-gray-300 px-2.5 py-1 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.dueDate}
          onChange={handleChange('dueDate')}
          disabled={disabled}
        />
      </div>
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">배점</div>
      <div className="border-b border-gray-300 px-3 py-2">
        <input
          className="h-8 w-[140px] border border-gray-300 px-2.5 py-1 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.score}
          onChange={handleChange('score')}
          disabled={disabled}
        />
      </div>
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">과제 설명</div>
      <div className="border-b border-gray-300 px-3 py-2">
        <textarea
          className="h-[360px] w-full resize-none border border-gray-300 px-2.5 py-2 leading-5 disabled:bg-gray-100 disabled:text-gray-500"
          value={form.description}
          onChange={handleChange('description')}
          disabled={disabled}
        />
      </div>
      <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">첨부파일</div>
      <div className="border-b border-gray-300 px-3 py-2">
        <div className="mb-2 text-xs text-gray-500">{form.attachmentName || '첨부파일 없음'}</div>
        <input className="h-8 w-[320px] border border-gray-300 px-2 py-1 disabled:bg-gray-100" type="file" disabled={disabled} />
      </div>
    </div>
  );
};

export const StudentAssignmentSubmitPage = () => {
  const [submitText, setSubmitText] = useState('핵심 로직과 시간복잡도를 함께 설명했습니다.');
  const [fileName, setFileName] = useState('sort_solution.py');

  return (
    <EclassPageFrame role="student">
      <div>
        <h2 className="mb-4 border-b-2 border-[#1a6d7e] pb-2 text-xl font-bold text-gray-800">과제 제출</h2>
        <div className="mb-1 text-[11px] text-gray-500">과제 출제 화면과 동일한 형식으로 제출 정보를 입력합니다.</div>
        <div className="mb-6 grid grid-cols-[118px_1fr] border-t-2 border-gray-500 text-xs">
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">과제명</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <input className="h-8 w-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-600" value="정렬 알고리즘 구현" disabled />
          </div>
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">공개일</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <input className="h-8 w-[220px] border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-600" value="2026.04.02 09:00" disabled />
          </div>
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">마감일</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <input className="h-8 w-[220px] border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-600" value="2026.04.09 23:59" disabled />
          </div>
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">배점</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <input className="h-8 w-[140px] border border-gray-300 bg-gray-100 px-2.5 py-1 text-gray-600" value="100" disabled />
          </div>
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">제출 설명</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <textarea
              className="h-[360px] w-full resize-none border border-gray-300 px-2.5 py-2 leading-5"
              value={submitText}
              onChange={(event) => setSubmitText(event.target.value)}
              placeholder="코드 설명, 실행 결과, 보완한 점 등을 충분히 길게 입력하세요."
            />
          </div>
          <div className="border-b border-gray-300 bg-[#f3f3f3] px-3 py-2 font-bold text-gray-700">첨부파일</div>
          <div className="border-b border-gray-300 px-3 py-2">
            <div className="mb-2 text-xs text-gray-500">{fileName}</div>
            <input
              className="h-8 w-[320px] border border-gray-300 px-2 py-1"
              type="file"
              onChange={(event) => setFileName(event.target.files?.[0]?.name || '파일이 선택되지 않았습니다.')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Link to="/student/assignment-list" className="border border-gray-400 bg-gray-50 px-4 py-1.5 text-sm text-gray-600">취소</Link>
          <Link to="/student/assignment-verify" className="bg-[#2b7c8e] px-4 py-1.5 text-sm font-bold text-white">제출</Link>
        </div>
      </div>
    </EclassPageFrame>
  );
};

export const StudentAssignmentVerifyPage = () => {
  const questionList = useMemo(
    () => [
      '제출한 코드에서 핵심 알고리즘을 선택한 이유를 설명해주세요.',
      '가장 중요하다고 생각한 함수 하나를 골라 입력과 출력을 설명해주세요.',
      '이 코드를 더 안정적으로 만들기 위해 개선할 수 있는 점을 말해주세요.',
    ],
    [],
  );
  const submittedCode = useMemo(
    () => `def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)`,
    [],
  );
  const codeLines = useMemo(() => submittedCode.split('\n'), [submittedCode]);
  const waveformBars = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const [phase, setPhase] = useState('voice-test');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [answerLockSeconds, setAnswerLockSeconds] = useState(6);
  const [sttOn, setSttOn] = useState(false);
  const [waveHeights, setWaveHeights] = useState(() => Array.from({ length: 24 }, () => 10));
  const [micState, setMicState] = useState('ready');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const dataArrayRef = useRef(null);
  const prevHeightsRef = useRef(Array.from({ length: 24 }, () => 10));

  useEffect(() => {
    if (phase !== 'voice-test') return undefined;
    const toStart = setTimeout(() => {
      setPhase('start-countdown');
      setCountdown(3);
    }, 2000);
    return () => clearTimeout(toStart);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'start-countdown' && phase !== 'next-countdown') return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('question');
          setAnswerLockSeconds(6);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'question') return undefined;
    const lockTimer = setInterval(() => {
      setAnswerLockSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(lockTimer);
  }, [phase, questionIndex]);

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

        const updateWave = () => {
          const node = analyserRef.current;
          const data = dataArrayRef.current;
          if (!node || !data) return;
          node.getByteFrequencyData(data);
          const levels = waveformBars.map((_, index) => {
            const ratioStart = index / waveformBars.length;
            const ratioEnd = (index + 1) / waveformBars.length;
            const logStart = Math.floor(Math.pow(ratioStart, 1.8) * data.length);
            const logEnd = Math.max(logStart + 1, Math.floor(Math.pow(ratioEnd, 1.8) * data.length));
            let sum = 0;
            for (let i = logStart; i < logEnd; i += 1) {
              const weighted = data[i] * (1 + i / data.length);
              sum += weighted;
            }
            const average = sum / Math.max(1, logEnd - logStart);
            const normalized = Math.min(1, average / 255);
            const curve = Math.pow(normalized, 0.85);
            const targetHeight = 7 + Math.round(curve * 42);
            const prev = prevHeightsRef.current[index] ?? 7;
            const smoothed = targetHeight > prev ? prev + (targetHeight - prev) * 0.62 : prev - (prev - targetHeight) * 0.18;
            prevHeightsRef.current[index] = smoothed;
            return Math.round(smoothed);
          });

          let energySum = 0;
          for (let i = 0; i < data.length; i += 1) {
            energySum += data[i];
          }
          const avgEnergy = energySum / data.length;
          setSttOn(avgEnergy > 16);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [waveformBars]);

  const handleAnswerComplete = () => {
    if (answerLockSeconds > 0) return;
    if (questionIndex >= questionList.length - 1) {
      setPhase('done');
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    setPhase('next-countdown');
    setCountdown(3);
  };

  return (
    <div className="min-h-screen bg-[#d9dcdb] px-6 py-12">
      <div className="mx-auto w-[980px] min-h-[860px] border border-gray-300 bg-white p-8 shadow-md">
        <h2 className="mb-4 border-b-2 border-[#1a6d7e] pb-2 text-xl font-bold text-gray-800">LLM 질문 응답</h2>
        {phase === 'voice-test' && (
          <div className="mb-5 min-h-[620px] border border-gray-300 bg-[#f9fbfb] p-6">
            <div className="mb-3 text-sm font-bold text-gray-700">음성 테스트</div>
            <div className="mb-4 text-xs text-gray-600">마이크를 확인하는 중입니다. 잠시만 기다려 주세요.</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="border border-gray-300 bg-white p-3">
                <div className="text-gray-500">멘트</div>
                <div className="mt-1 font-bold text-[#1a6d7e]">“테스트 멘트를 읽어주세요”</div>
              </div>
              <div className="border border-gray-300 bg-white p-3">
                <div className="text-gray-500">마이크 상태</div>
                <div className="mt-1 font-bold text-[#1a6d7e]">
                  {micState === 'loading' && '마이크 연결 중...'}
                  {micState === 'ready' && '마이크 연결 완료'}
                  {micState === 'blocked' && '마이크 권한이 필요합니다'}
                </div>
              </div>
              <div className="border border-gray-300 bg-white p-3">
                <div className="text-gray-500">제출한 코드</div>
                <div className="mt-1 font-bold text-[#1a6d7e]">sort_solution.py</div>
              </div>
            </div>
          </div>
        )}
        {(phase === 'start-countdown' || phase === 'next-countdown') && (
          <div className="mb-5 flex min-h-[620px] flex-col items-center justify-center border border-gray-300 bg-white p-8 text-center">
            <div className="mb-2 text-sm text-gray-600">{phase === 'start-countdown' ? '곧 시작합니다' : '다음 질문 준비하세요'}</div>
            <div className="text-6xl font-extrabold text-[#1a6d7e]">{countdown}</div>
          </div>
        )}
        {phase === 'question' && (
          <div className="flex min-h-[620px] flex-col gap-4">
            <div className="grid grid-cols-[1.1fr_1fr] gap-4">
              <div className="border border-gray-300">
                <div className="border-b border-gray-300 bg-[#f3f3f3] px-4 py-2 text-xs font-bold text-gray-700">제출 코드 에디터 · sort_solution.py</div>
                <div className="h-[500px] overflow-auto bg-[#0f172a] px-3 py-3 font-mono text-xs text-gray-100">
                  {codeLines.map((line, index) => (
                    <div key={`${index + 1}-${line}`} className="flex">
                      <span className="w-8 shrink-0 pr-3 text-right text-gray-400">{index + 1}</span>
                      <span className="whitespace-pre">{line || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex min-h-[500px] flex-col">
                <div className="mb-4 border border-gray-300">
                  <div className="border-b border-gray-300 bg-[#f3f3f3] px-4 py-2 text-xs font-bold text-gray-700">질문</div>
                  <div className="min-h-[220px] bg-white px-4 py-4 text-sm text-gray-800">{questionList[questionIndex]}</div>
                </div>
              </div>
            </div>
            <div className="border border-gray-300">
              <div className="border-b border-gray-300 bg-[#f3f3f3] px-4 py-2 text-xs font-bold text-gray-700">답변 중임을 표시</div>
              <div className="flex min-h-[120px] items-center justify-between bg-white px-6 py-4 text-sm">
                <div className="flex items-center gap-4">
                  <span className={`inline-block h-3 w-3 rounded-full ${sttOn ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <div className="flex h-12 items-end gap-1">
                    {waveformBars.map((bar, index) => (
                      <span
                        key={bar}
                        className={`${sttOn ? 'bg-[#2b7c8e]' : 'bg-gray-300'} w-1.5 rounded-sm`}
                        style={{ height: `${waveHeights[index] ?? 8}px` }}
                      ></span>
                    ))}
                  </div>
                  <span className="font-semibold text-[#1a6d7e]">
                    {micState === 'blocked' ? '마이크 권한 필요' : sttOn ? '보이스 인식 중' : '보이스 대기 중'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAnswerComplete}
                disabled={answerLockSeconds > 0}
                className={`px-4 py-1.5 text-sm font-bold text-white ${answerLockSeconds > 0 ? 'bg-gray-400' : 'bg-[#2b7c8e]'}`}
              >
                {answerLockSeconds > 0 ? `답변 완료 (${answerLockSeconds}s)` : '답변 완료'}
              </button>
            </div>
          </div>
        )}
        {phase === 'done' && (
          <div className="flex min-h-[620px] flex-col items-center justify-center border border-[#bdd3d8] bg-[#edf6f8] p-8 text-center">
            <div className="mb-2 text-lg font-bold text-[#1a6d7e]">모든 답변이 제출되었습니다.</div>
            <Link to="/student/assignment-list" className="bg-[#2b7c8e] px-4 py-1.5 text-sm font-bold text-white">
              과제 리스트로 이동
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export const InstructorAssignmentDetailPage = () => {
  const initialForm = useMemo(
    () => ({
      title: '정렬 알고리즘 구현',
      openDate: '2026.04.02 09:00',
      dueDate: '2026.04.09 23:59',
      score: '100',
      description: 'merge sort를 구현하고 시간복잡도 분석을 작성하세요.',
      attachmentName: 'assignment_spec.pdf',
    }),
    [],
  );
  const [activeTab, setActiveTab] = useState('detail');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('a1');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const assignments = useMemo(
    () => [
      { id: 'a1', title: '정렬 알고리즘 구현', description: '정렬 원리와 코드 설명 포함', dueDate: '2026.04.09 23:59' },
      { id: 'a2', title: '그래프 탐색 과제', description: 'BFS/DFS 비교 분석', dueDate: '2026.04.16 23:59' },
    ],
    [],
  );
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) || assignments[0],
    [assignments, selectedAssignmentId],
  );
  const dashboardRows = useMemo(
    () => [
      {
        id: 's1',
        student: '김학생(202301001)',
        status: '정상',
        score: 92,
        understanding: '초록',
        anomaly: '노랑',
        departmentYear: '컴퓨터공학과 3학년',
        attachment: 'sort_solution.py',
        submittedAt: '2026.04.03 14:10',
        understandingEvidence: '핵심 함수 설명이 정확하고 시간복잡도 비교 근거가 명확합니다.',
        anomalyEvidence: '답변 흐름은 안정적이나 1개 문항에서 지연 응답이 발생했습니다.',
      },
      {
        id: 's2',
        student: '이학생(202301027)',
        status: '미제출',
        score: '-',
        understanding: '빨강',
        anomaly: '주황',
        departmentYear: '컴퓨터공학과 2학년',
        attachment: '-',
        submittedAt: '-',
        understandingEvidence: '제출 데이터가 없어 이해도 평가가 낮음으로 표시되었습니다.',
        anomalyEvidence: '제출 미완료 상태로 이상패턴 분석이 제한적입니다.',
      },
      {
        id: 's3',
        student: '박학생(202301044)',
        status: '정상',
        score: 88,
        understanding: '노랑',
        anomaly: '초록',
        departmentYear: 'AI융합학부 4학년',
        attachment: 'report.pdf',
        submittedAt: '2026.04.03 15:03',
        understandingEvidence: '코드 설명은 적절하나 엣지 케이스 근거가 일부 부족합니다.',
        anomalyEvidence: '응답 패턴이 일정하고 음성 인식 품질도 안정적입니다.',
      },
    ],
    [],
  );

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(initialForm);
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
  };
  const toggleRow = (rowId) => {
    setSelectedRows((prev) => (prev.includes(rowId) ? prev.filter((item) => item !== rowId) : [...prev, rowId]));
  };
  const allChecked = selectedRows.length > 0 && selectedRows.length === dashboardRows.length;
  const toggleAllRows = () => {
    if (allChecked) {
      setSelectedRows([]);
      return;
    }
    setSelectedRows(dashboardRows.map((row) => row.id));
  };

  const gradeColorClass = (grade) => {
    if (grade === '빨강') return 'bg-red-500';
    if (grade === '주황') return 'bg-orange-500';
    if (grade === '노랑') return 'bg-yellow-400';
    if (grade === '초록') return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <EclassPageFrame role="instructor">
      <div>
        <h2 className="mb-4 border-b-2 border-[#1a6d7e] pb-2 text-xl font-bold text-gray-800">과제 상세</h2>
        <div className="mb-4 flex items-end justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('detail')}
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'detail' ? 'bg-[#2b7c8e] text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              과제상세정보
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'dashboard' ? 'bg-[#2b7c8e] text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              대시보드
            </button>
          </div>
          {activeTab === 'detail' && (
            <div className="flex gap-2">
              {!isEditing && (
                <button onClick={handleEditStart} className="bg-[#1a6d7e] px-4 py-1.5 text-sm font-bold text-white">
                  수정
                </button>
              )}
              {isEditing && (
                <>
                  <button onClick={handleCancelEdit} className="border border-gray-400 bg-gray-50 px-4 py-1.5 text-sm text-gray-600">
                    취소
                  </button>
                  <button onClick={handleSave} className="bg-[#1a6d7e] px-4 py-1.5 text-sm font-bold text-white">
                    저장
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {activeTab === 'detail' && <AssignmentEditorForm form={form} setForm={setForm} disabled={!isEditing} />}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 text-sm">
            <div className="border border-gray-300">
              <div className="border-b border-gray-300 bg-[#f3f3f3] px-4 py-2 text-xs font-bold text-gray-700">과제 목록</div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                    className={`border px-3 py-2 text-left ${selectedAssignmentId === assignment.id ? 'border-[#2b7c8e] bg-[#eef7f9]' : 'border-gray-300 bg-white'}`}
                  >
                    <div className="font-bold text-[#1a6d7e]">{assignment.title}</div>
                    <div className="text-xs text-gray-600">{assignment.description}</div>
                    <div className="text-xs text-gray-500">기한: {assignment.dueDate}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="border border-gray-300">
              <div className="flex items-center justify-between border-b border-gray-300 bg-[#f3f3f3] px-4 py-2">
                <div className="text-xs font-bold text-gray-700">
                  결과 대시보드 · {selectedAssignment.title} · 기한 {selectedAssignment.dueDate}
                </div>
                <button
                  disabled={selectedRows.length === 0}
                  className={`px-3 py-1 text-xs font-bold ${selectedRows.length === 0 ? 'bg-gray-300 text-white' : 'bg-[#1a6d7e] text-white'}`}
                >
                  등급 보고서 다운
                </button>
              </div>
              <table className="w-full text-center text-xs">
                <thead className="bg-[#888] text-white">
                  <tr>
                    <th className="py-2 font-normal"><input type="checkbox" checked={allChecked} onChange={toggleAllRows} /></th>
                    <th className="py-2 font-normal">이름(학번)</th>
                    <th className="py-2 font-normal">제출현황</th>
                    <th className="py-2 font-normal">점수</th>
                    <th className="py-2 font-normal">이해도 등급</th>
                    <th className="py-2 font-normal">이상패턴 등급</th>
                    <th className="py-2 font-normal">학과 학년</th>
                    <th className="py-2 font-normal">첨부파일</th>
                    <th className="py-2 font-normal">제출 시각</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-200">
                      <td className="py-2"><input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} /></td>
                      <td className="py-2">{row.student}</td>
                      <td className={`py-2 font-bold ${row.status === '정상' ? 'text-green-600' : 'text-red-500'}`}>{row.status}</td>
                      <td className="py-2">{row.score}</td>
                      <td className="py-2">
                        <button
                          onClick={() => setSelectedEvidence({ type: '이해도 등급', grade: row.understanding, reason: row.understandingEvidence })}
                          className="mx-auto flex items-center gap-1 underline"
                        >
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${gradeColorClass(row.understanding)}`}></span>
                          {row.understanding}
                        </button>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => setSelectedEvidence({ type: '이상패턴 등급', grade: row.anomaly, reason: row.anomalyEvidence })}
                          className="mx-auto flex items-center gap-1 underline"
                        >
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${gradeColorClass(row.anomaly)}`}></span>
                          {row.anomaly}
                        </button>
                      </td>
                      <td className="py-2">{row.departmentYear}</td>
                      <td className="py-2">{row.attachment}</td>
                      <td className="py-2">{row.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedEvidence && (
              <div className="border border-[#bdd3d8] bg-[#edf6f8] p-4">
                <div className="mb-1 text-xs font-bold text-[#1a6d7e]">
                  {selectedEvidence.type} · {selectedEvidence.grade} 근거
                </div>
                <div className="text-sm text-gray-700">{selectedEvidence.reason}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-300 p-4">
                <div className="mb-2 text-xs font-bold text-gray-700">이해도 등급 분포</div>
                <div className="space-y-2">
                  {[
                    ['빨강', 2, 'bg-red-500'],
                    ['주황', 5, 'bg-orange-500'],
                    ['노랑', 9, 'bg-yellow-400'],
                    ['초록', 12, 'bg-green-500'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-10 text-xs">{label}</div>
                      <div className="h-3 flex-1 bg-gray-100">
                        <div className={`h-3 ${color}`} style={{ width: `${Number(value) * 7}%` }}></div>
                      </div>
                      <div className="w-8 text-right text-xs">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-300 p-4">
                <div className="mb-2 text-xs font-bold text-gray-700">이상 패턴 등급 분포</div>
                <div className="space-y-2">
                  {[
                    ['빨강', 1, 'bg-red-500'],
                    ['주황', 4, 'bg-orange-500'],
                    ['노랑', 8, 'bg-yellow-400'],
                    ['초록', 15, 'bg-green-500'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-10 text-xs">{label}</div>
                      <div className="h-3 flex-1 bg-gray-100">
                        <div className={`h-3 ${color}`} style={{ width: `${Number(value) * 7}%` }}></div>
                      </div>
                      <div className="w-8 text-right text-xs">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EclassPageFrame>
  );
};

export const InstructorAssignmentCreatePage = () => {
  const [form, setForm] = useState({
    title: '',
    openDate: '2026.04.02 09:00',
    dueDate: '2026.04.09 23:59',
    score: '100',
    description: '',
    attachmentName: '',
  });

  return (
    <EclassPageFrame role="instructor">
      <div>
        <h2 className="mb-4 border-b-2 border-[#1a6d7e] pb-2 text-xl font-bold text-gray-800">과제 출제</h2>
        <AssignmentEditorForm form={form} setForm={setForm} disabled={false} />
      </div>
    </EclassPageFrame>
  );
};
