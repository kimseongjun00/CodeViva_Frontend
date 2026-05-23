const BASE = '/api';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('cv_prof_token') : null;

const client = async (path, options = {}, tokenOverride) => {
  const isForm = options.body instanceof FormData;
  const token = tokenOverride ?? getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`${res.status}`);
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

// ── 인증
export const login = ({ email, password }) =>
  client('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = ({ name, email, password, role }) =>
  client('/users/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });

export const getMe = (token) => client('/users/me', {}, token);

export const getAllUsers = () => client('/users/all');

// ── 과목
export const getCourses = () => client('/courses');

export const createCourse = ({ name, year, semester }) =>
  client('/courses', { method: 'POST', body: JSON.stringify({ name, year, semester }) });

// ── 수강생
export const getCourseUsers = (courseId) =>
  client(`/course-users/course/${courseId}`);

export const enrollStudent = ({ courseId, userId }) =>
  client('/course-users', {
    method: 'POST',
    body: JSON.stringify({ courseId, userId, courseRole: 'STUDENT' }),
  });

// ── 학생 계정 자동 생성 + userId 반환
export const registerStudentGetId = async ({ name, studentId }) => {
  const email = `${studentId}@codeviva.kr`;
  const password = String(studentId);

  let studentToken;

  // 가입 시도
  try {
    const res = await register({ name, email, password, role: 'STUDENT' });
    studentToken = res.token;
  } catch (e) {
    // 이미 존재(409) → 로그인으로 토큰 획득
    if (e?.message === '409') {
      try {
        const res = await login({ email, password });
        studentToken = res.token;
      } catch (le) {
        throw new Error(`로그인 실패 (${le?.message})`);
      }
    } else {
      throw new Error(`계정 생성 실패 (${e?.message})`);
    }
  }

  const me = await getMe(studentToken);
  return { id: me.id, name: me.name, email };
};

// ── 과제
export const getAssignmentsByCourse = (courseId) =>
  client(`/assignments/course/${courseId}`);

export const updateAssignment = ({ id, title, description, openAt, dueAt, score }) => {
  const form = new FormData();
  form.append('id', id);
  if (title)       form.append('title', title);
  if (openAt)      form.append('openAt', openAt);
  if (dueAt)       form.append('dueAt', dueAt);
  if (score != null) form.append('score', score);
  if (description != null) form.append('description', description);
  return client('/assignments', { method: 'PUT', body: form });
};

export const createAssignment = ({ courseId, title, description, openAt, dueAt, score }) => {
  const form = new FormData();
  form.append('courseId', courseId);
  form.append('title', title);
  form.append('openAt', openAt);
  form.append('dueAt', dueAt);
  if (description) form.append('description', description);
  if (score != null) form.append('score', score);
  return client('/assignments', { method: 'POST', body: form });
};

export const updateSubmission = ({ id, code }) =>
  studentClient('/submissions', { method: 'PUT', body: JSON.stringify({ id, code }) });

// ── 학생 전용 클라이언트 (cv_student_token 사용 — 교수 토큰과 충돌 방지)
const getStudentToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('cv_student_token') : null;

const studentClient = async (path, options = {}) => {
  const isForm = options.body instanceof FormData;
  const token = getStudentToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`${res.status}`);
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

// ── 제출 (학생 토큰 사용)
export const createSubmission = ({ assignmentId, code }) =>
  studentClient('/submissions', { method: 'POST', body: JSON.stringify({ assignmentId, code }) });

// 교수/학생 둘 다 호출하므로 교수 토큰 우선, 없으면 학생 토큰 사용
export const getSubmission = (id) => {
  const token = (typeof window !== 'undefined')
    ? (localStorage.getItem('cv_prof_token') || localStorage.getItem('cv_student_token'))
    : null;
  return client(`/submissions/${id}`, {}, token ?? undefined);
};

export const getMySubmissions = () => studentClient('/submissions/my');

export const getSubmissionsByAssignment = (assignmentId) =>
  client(`/submissions/assignment/${assignmentId}`);

export const evaluateAssignment = (assignmentId) =>
  client(`/assignments/${assignmentId}/evaluate`, { method: 'POST' });

// ── 답변
export const getAnswersBySubmission = (submissionId) =>
  client(`/submission-answers/submission/${submissionId}`);

export const saveBatchAnswers = ({ submissionId, questionIds, audioFiles, monitoring = {} }) => {
  const form = new FormData();
  form.append('submissionId', submissionId);
  questionIds.forEach((id) => form.append('questionIds', id));
  audioFiles.forEach((f, i) => {
    const blob = new Blob([f], { type: 'audio/webm' });
    form.append('audioFiles', blob, `answer_${i}.webm`);
  });
  // 모니터링 필드 (세션 전체 단일 값)
  const MONITORING_KEYS = [
    'tabSwitchCount', 'windowBlurCount', 'cursorOutCount',
    'fullscreenExitCount', 'micMuteCount', 'devToolsCount',
    'totalSilenceCount', 'answerTimeouts',
  ];
  MONITORING_KEYS.forEach((key) => {
    if (monitoring[key] != null) form.append(key, String(monitoring[key]));
  });
  return studentClient('/submission-answers/batch', { method: 'POST', body: form });
};
