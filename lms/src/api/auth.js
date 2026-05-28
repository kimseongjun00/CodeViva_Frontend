import { apiClient } from './client';

export const login = ({ email, password }) =>
  apiClient('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = ({ name, email, password }) =>
  apiClient('/users/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const getMe = () => apiClient('/users/me');

export const getAllUsers = () => apiClient('/users/all');

export const changePassword = ({ currentPassword, newPassword }) =>
  apiClient('/users/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });

// 학번으로 학생 계정 생성(또는 기존 계정 조회) → userId 반환
export const registerStudentGetId = async ({ studentId, name }) => {
  const email = `${studentId}@codeviva.kr`;
  const password = String(studentId);
  try {
    const res = await register({ name, email, password });
    // 신규 생성: 토큰에서 userId 조회
    const me = await apiClient('/users/me', {
      headers: { Authorization: `Bearer ${res.token}` },
    });
    return { id: me.id };
  } catch (e) {
    if (e?.message === '400' || e?.message === '409') {
      // 이미 존재 → 로그인으로 id 획득
      const res = await login({ email, password });
      const me = await apiClient('/users/me', {
        headers: { Authorization: `Bearer ${res.token}` },
      });
      return { id: me.id };
    }
    throw e;
  }
};
