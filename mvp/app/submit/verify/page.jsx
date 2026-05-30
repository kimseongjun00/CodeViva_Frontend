'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSubmission, saveBatchAnswers, updateSubmission } from '../../../lib/api';

// 무음 감지 임계치 — 평균 주파수 에너지 (0~255). 낮출수록 민감해짐
const SILENCE_THRESHOLD = 8;

/* ──────────────────────────────────────────────────────────
   헬퍼
────────────────────────────────────────────────────────── */
const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const stripComments = (code) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, '')        // /* */ 블록 주석
    .replace(/\/\/[^\n]*/g, '')               // // 한줄 주석
    .replace(/(^|\n)[ \t]*#[^\n]*/g, '$1')   // # Python 주석
    .replace(/\n{3,}/g, '\n\n')              // 빈줄 정리
    .trim();

/* ──────────────────────────────────────────────────────────
   상수
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

/* ──────────────────────────────────────────────────────────
   보안 위험도 가중치 기준
────────────────────────────────────────────────────────── */
const RISK_RULES = [
  { key: 'devToolsCount',       label: 'DevTools 감지',  weight: 5, thresholds: [Infinity, 1] }, // 1회부터 바로 빨강
  { key: 'tabSwitchCount',      label: '탭 전환',        weight: 4, thresholds: [1, 2] },
  { key: 'windowBlurCount',     label: '앱 전환',        weight: 3, thresholds: [2, 4] },
  { key: 'micMuteCount',        label: '마이크 음소거',  weight: 3, thresholds: [1, 2] },
  { key: 'fullscreenExitCount', label: '전체화면 해제',  weight: 2, thresholds: [1, 2] },
  { key: 'cursorOutCount',      label: '커서 이탈',      weight: 1, thresholds: [3, 6] },
  { key: 'totalSilenceCount',   label: '무음 구간',      weight: 1, thresholds: [2, 4] },
];
const MAX_WEIGHTED_SCORE = RISK_RULES.reduce((s, r) => s + r.weight * 2, 0);

const getRiskLevel = (count, [yellowAt, redAt]) => {
  if (count >= redAt) return 'red';
  if (count >= yellowAt) return 'yellow';
  return 'green';
};

const computeOverallRisk = (counts) => {
  const items = RISK_RULES.map((r) => {
    const count = counts[r.key] ?? 0;
    const level = getRiskLevel(count, r.thresholds);
    return { ...r, count, level };
  });
  const score = items.reduce((s, item) => {
    const pts = item.level === 'red' ? 2 : item.level === 'yellow' ? 1 : 0;
    return s + item.weight * pts;
  }, 0);
  const ratio = score / MAX_WEIGHTED_SCORE;
  const hasHighRed = items.some((item) => item.level === 'red' && item.weight >= 4);
  const overall = hasHighRed || ratio > 0.4 ? 'red' : ratio > 0.15 ? 'yellow' : 'green';
  return { items, score, ratio, overall };
};

/* ──────────────────────────────────────────────────────────
   렌즈 마스킹 컴포넌트 (직사각형)
────────────────────────────────────────────────────────── */
const LensMaskedText = ({ children, lensW = 220, lensH = 110 }) => {
  const [pos, setPos] = React.useState({ x: -999, y: -999, cw: 0, ch: 0 });
  const containerRef = React.useRef(null);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, cw: rect.width, ch: rect.height });
  };

  const { x, y, cw, ch } = pos;
  const top    = y - lensH / 2;
  const right  = cw - x - lensW / 2;
  const bottom = ch - y - lensH / 2;
  const left   = x - lensW / 2;

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos({ x: -999, y: -999, cw: 0, ch: 0 })}
    >
      {/* 블러 레이어 */}
      <div style={{ filter: 'blur(9px)', userSelect: 'none', pointerEvents: 'none' }}>
        {children}
      </div>
      {/* 렌즈 (직사각형) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: x > 0 ? `inset(${top}px ${right}px ${bottom}px ${left}px round 6px)` : 'inset(100%)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
      {/* 렌즈 테두리 */}
      {x > 0 && (
        <div
          className="pointer-events-none absolute rounded-md border border-teal-400/40 shadow-[0_0_14px_rgba(45,212,191,0.18)]"
          style={{ width: lensW, height: lensH, left: x - lensW / 2, top: y - lensH / 2 }}
        />
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   AI 검증 인터뷰 (학생)
────────────────────────────────────────────────────────── */
function StudentAssignmentVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submissionId');

  const [questions, setQuestions] = useState([]);
  const [submissionCode, setSubmissionCode] = useState(MOCK_CODE);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [interviewBlocked, setInterviewBlocked] = useState(false);
  const submissionCodeRef = useRef('');
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
  const [submittingText, setSubmittingText] = useState('');
  const [submitError, setSubmitError] = useState('');
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
  const hasSubmittedRef = useRef(false);
  const answerTimerRef = useRef(null);
  const answerElapsedRef = useRef(0);
  const questionTimesRef = useRef({});
  const securityLogRef = useRef([]);
  const devToolsCountRef = useRef(0);
  const focusLossCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  const windowBlurCountRef = useRef(0);
  const cursorOutCountRef = useRef(0);
  const fullscreenExitCountRef = useRef(0);
  const micMuteCountRef = useRef(0);
  const totalSilenceCountRef = useRef(0);
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

  // 질문 로드 — QUESTION_GENERATING 상태면 3초마다 폴링 (최대 2분 후 타임아웃)
  useEffect(() => {
    if (!submissionId) {
      setQuestions(MOCK_QUESTIONS);
      setLoadingQuestions(false);
      return;
    }
    // 이미 질문을 받은 적 있으면 재접속 차단
    if (localStorage.getItem(`cv_interview_started_${submissionId}`)) {
      setInterviewBlocked(true);
      return;
    }

    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 40; // 1.5초 × 40 = 60초

    const poll = async () => {
      try {
        const sub = await getSubmission(submissionId);
        if (cancelled) return;
        if (sub.code) {
          setSubmissionCode(sub.code);
          submissionCodeRef.current = sub.code;
        }
        const status = sub.aiValidationStatus;
        if (status === 'QUESTION_GENERATION_FAILED') {
          setPollTimedOut(true);
          setLoadingQuestions(false);
          return;
        }
        // 이미 평가 완료/진행 중 → 인터뷰 건너뛰고 완료 화면으로
        if (status === 'EVALUATED') {
          setLoadingQuestions(false);
          setPhase('done');
          return;
        }
        if (status === 'EVALUATING' || status === 'AWAITING_EVALUATION') {
          setPhase('done');
          return;
        }
        const qs = sub.prompt1Questions ?? [];
        if (qs.length > 0) {
          // 재접속 차단용: 질문을 받은 시점을 localStorage에 기록
          localStorage.setItem(`cv_interview_started_${submissionId}`, '1');
          setQuestions(qs);
          setLoadingQuestions(false);
          return;
        }
        // 질문이 아직 없으면 (AWAITING_AUDIO_ANSWERS 포함) 계속 폴링
        // mock ID로 폴백하면 배치 제출 시 400 에러 발생
        pollCount += 1;
        if (pollCount >= MAX_POLLS) {
          setPollTimedOut(true);
          setLoadingQuestions(false);
          return;
        }
        setTimeout(poll, 1500);
      } catch {
        if (!cancelled) {
          // 네트워크 오류 → 재시도
          pollCount += 1;
          if (pollCount >= MAX_POLLS) {
            setPollTimedOut(true);
            setLoadingQuestions(false);
          } else {
            setTimeout(poll, 1500);
          }
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
        tabSwitchCountRef.current += 1;
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
        fullscreenExitCountRef.current += 1;
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
      windowBlurCountRef.current += 1;
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
        cursorOutCountRef.current += 1;
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
            micMuteCountRef.current += 1;
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
            micMuteCountRef.current += 1;
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
          const isActive = energySum / data.length > SILENCE_THRESHOLD;
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
      // 250ms 단위로 데이터 수집 (타이밍 이슈 방지)
      const recorder = new MediaRecorder(streamRef.current, {
        audioBitsPerSecond: 16000,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(250);
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

  // voice-test 1분 타이머 → start-countdown (마이크 차단 시 자동 진행 안 함)
  useEffect(() => {
    if (phase !== 'voice-test') return;
    setMicTestTimer(60);
    const interval = setInterval(() => {
      setMicTestTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (micState !== 'blocked') {
            setPhase('start-countdown');
            setCountdown(3);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, micState]);

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
          if (duration >= 5) {
            m.maxSilence = Math.max(m.maxSilence, duration);
            m.totalSilence += duration;
            m.count += 1;
            totalSilenceCountRef.current += 1;
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
    if (hasSubmittedRef.current) return; // 중복 제출 방지
    hasSubmittedRef.current = true;
    setSubmitting(true);
    setPhase('submitting');
    setSubmittingText('음성 파일을 업로드하고 있습니다...');
    try {
      const audioFiles = questions.map((_, i) => {
        const blob = recordedAudiosRef.current[i];
        return blob ?? new Blob([], { type: 'audio/webm' });
      });
      await saveBatchAnswers({
        submissionId: Number(submissionId),
        questionIds: questions.map((q) => q.id),
        audioFiles,
        monitoring: {
          tabSwitchCount:      tabSwitchCountRef.current,
          windowBlurCount:     windowBlurCountRef.current,
          cursorOutCount:      cursorOutCountRef.current,
          fullscreenExitCount: fullscreenExitCountRef.current,
          micMuteCount:        micMuteCountRef.current,
          devToolsCount:       devToolsCountRef.current,
          totalSilenceCount:   totalSilenceCountRef.current,
          answerTimeouts:      securityLogRef.current.filter((e) => e.type === 'answer_timeout').length,
        },
      });
    } catch (e) {
      setSubmitError('답변 제출에 실패했습니다. 네트워크 상태를 확인하거나 담당 교수님께 문의하세요.');
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

  const handleRetryGeneration = async () => {
    setPollTimedOut(false);
    setLoadingQuestions(true);
    try {
      await updateSubmission({
        id: Number(submissionId),
        code: submissionCodeRef.current || MOCK_CODE,
      });
    } catch {
      // 재트리거 실패해도 폴링은 다시 시작
    }
    // 폴링 재시작을 위해 key 역할인 submissionId는 그대로 — useEffect 재실행 트리거
    window.location.reload();
  };

  if (interviewBlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-900/50">
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <p className="mb-1 text-base font-bold text-red-400">재응시 불가</p>
        <p className="text-sm text-slate-400">이미 AI 검증 인터뷰가 시작된 제출입니다.<br/>중도 이탈 후 재응시는 허용되지 않습니다.</p>
        <button
          onClick={() => router.push('/student/dashboard')}
          className="mt-6 rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-center">
        <p className="mb-2 text-base font-bold text-red-400">오류가 발생했습니다</p>
        <p className="text-sm text-slate-400">{loadError}</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
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

      <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
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
            <div className="m-auto w-full max-w-[600px]">
              {/* 타이틀 + 타이머 */}
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <h3 className="text-[22px] font-bold tracking-tight text-slate-900">마이크 테스트</h3>
                  <p className="mt-1 text-[13px] text-slate-500">AI 질문 준비 중 — 마이크와 환경을 점검하세요.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[30px] font-extrabold tabular-nums leading-none text-slate-800">{micTestTimer}</span>
                  <span className="mt-0.5 text-[11px] text-slate-400">초 남음</span>
                </div>
              </div>

              {/* AI 준비 상태 */}
              {pollTimedOut ? (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5">
                  <p className="text-[13px] font-bold text-red-700">질문 생성 시간 초과</p>
                  <p className="mt-0.5 text-[12px] text-red-500">AI 서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.</p>
                  <div className="mt-2.5 flex gap-2">
                    <button onClick={handleRetryGeneration}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-red-700">
                      다시 시도
                    </button>
                    <button onClick={() => router.push('/student/dashboard')}
                      className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-50">
                      대시보드로 돌아가기
                    </button>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <svg className="h-4 w-4 shrink-0 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-[13px] text-slate-600">코드를 분석해 질문을 생성하는 중입니다...</p>
                </div>
              ) : (
                <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-bold text-emerald-600">✓</span>
                  <p className="text-[13px] font-semibold text-emerald-700">질문 준비 완료 — 인터뷰를 시작할 수 있습니다.</p>
                </div>
              )}

              {/* 파형 */}
              <div className="relative mb-4 flex h-24 items-end justify-center overflow-hidden rounded-xl bg-[#0d1117] px-5 pb-4">
                <div className="flex h-16 w-full items-end justify-center gap-[3px]">
                  {waveformBars.map((bar, i) => (
                    <span
                      key={bar}
                      className="w-1.5 rounded-t-sm transition-all duration-75"
                      style={{
                        height: `${waveHeights[i] ?? 2}px`,
                        backgroundColor: sttOn ? '#2dd4bf' : '#475569',
                        opacity: sttOn ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 마이크 상태 + 테스트 멘트 */}
              <div className="mb-6 flex items-center justify-between px-1 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${
                    micState === 'ready' ? 'bg-emerald-500' :
                    micState === 'blocked' ? 'bg-red-500' :
                    'animate-pulse bg-amber-400'
                  }`}/>
                  <span className="text-[13px] text-slate-600">
                    {micState === 'loading' && '마이크 확인 중...'}
                    {micState === 'ready' && '마이크 연결됨'}
                    {micState === 'blocked' && '마이크 권한 필요'}
                  </span>
                </div>
                <span className="text-[12px] italic text-slate-400">"테스트 멘트를 읽어주세요"</span>
              </div>

              {/* 안내 */}
              <div className="mb-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">인터뷰 안내</p>
                <p className="mb-3 text-[13px] text-slate-700">
                  모든 질문은 <strong>제출한 코드에 기반하여</strong> 설명해야 합니다.
                </p>
                <div className="space-y-2 text-[12px] text-slate-500">
                  {[
                    '질문을 소리 내어 읽지 마세요 — AI 도구 활용으로 간주됩니다.',
                    '답변 내용이 코드와 무관하면 의심 사례로 분류됩니다.',
                    '탭 전환, 커서 이탈, 음소거 등 이상 패턴은 자동으로 기록됩니다.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-slate-300">–</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  감지 항목: 탭 전환 · 앱 전환 · 커서 이탈 · 음소거 · 전체화면 해제 · 개발자 도구 · 무음 구간
                </p>
              </div>

              <button
                onClick={handleSkipMicTest}
                disabled={questions.length === 0 || pollTimedOut || micState === 'blocked'}
                className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
                  questions.length === 0 || pollTimedOut || micState === 'blocked'
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-[#1a6d7e] text-white hover:bg-teal-800'
                }`}
              >
                {questions.length === 0 ? 'AI 질문 생성 중...' : micState === 'blocked' ? '마이크 권한 필요' : '인터뷰 시작'}
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
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2">
                      <span className="text-teal-500 text-sm">💡</span>
                      <p className="text-xs font-semibold text-teal-700">코드에 기반하여 설명하시오.</p>
                    </div>
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
                  >{stripComments(submissionCode)}</pre>
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

          {/* 제출 중 / 완료 — 보안 기록 화면 */}
          {(phase === 'submitting' || phase === 'done') && (
            <div className="m-auto w-full max-w-lg overflow-y-auto py-2">
              {/* 상태 헤더 */}
              <div className="mb-6 text-center">
                {phase === 'submitting' ? (
                  <>
                    <div className="mb-3 flex justify-center">
                      <svg className="h-8 w-8 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                    <h2 className="text-[20px] font-bold text-slate-900">답변 제출 중</h2>
                    <p className="mt-1 text-[13px] text-slate-500">AI가 답변을 분석하고 있습니다. 창을 닫지 마세요.</p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-[20px] font-bold text-slate-900">{submitError ? '제출 오류' : '검증 완료'}</h2>
                    <p className="mt-1 text-[13px] text-slate-500">
                      {submitError ? submitError : '모든 답변이 정상적으로 제출되었습니다.'}
                    </p>
                  </>
                )}
              </div>

              {/* 보안 기록 */}
              {(() => {
                const { items, score, overall } = computeOverallRisk({
                  devToolsCount, tabSwitchCount, windowBlurCount,
                  micMuteCount, fullscreenExitCount, cursorOutCount, totalSilenceCount,
                });
                const overallCfg = {
                  red:    { bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',     label: '의심', text: 'text-red-600' },
                  yellow: { bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   label: '주의', text: 'text-amber-600' },
                  green:  { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', label: '정상', text: 'text-emerald-600' },
                }[overall];
                const levelCfg = {
                  red:    { row: 'border border-red-200 bg-red-50',     badge: 'bg-red-100 text-red-600' },
                  yellow: { row: 'border border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-600' },
                  green:  { row: 'bg-slate-50',                         badge: 'bg-slate-100 text-slate-500' },
                };
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    {/* 종합 위험도 */}
                    <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-3 ${overallCfg.bg} ${overallCfg.border}`}>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">종합 위험도</p>
                        <p className={`mt-0.5 text-[22px] font-extrabold ${overallCfg.text}`}>{overallCfg.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${overallCfg.dot}`}/>
                        <span className="text-[13px] font-bold text-slate-700">{score} / {MAX_WEIGHTED_SCORE}점</span>
                      </div>
                    </div>

                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">항목별 기록</p>
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const cfg = levelCfg[item.level];
                        return (
                          <div key={item.key} className={`flex items-center justify-between rounded-lg px-4 py-2 ${cfg.row}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-slate-700">{item.label}</span>
                              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-400">×{item.weight}</span>
                            </div>
                            <span className={`rounded-md px-2.5 py-0.5 text-[12px] font-bold tabular-nums ${cfg.badge}`}>
                              {item.count}회
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-center text-[11px] text-slate-400">이상현상 발생 시 고객센터로 문의 바랍니다.</p>
                  </div>
                );
              })()}

              {phase === 'done' && (
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  대시보드로 돌아가기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-sm text-slate-400">로딩 중...</p>
      </div>
    }>
      <StudentAssignmentVerifyPage />
    </Suspense>
  );
}
