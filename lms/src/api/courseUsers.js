import { apiClient } from './client';

export const getCourseUsers = (courseId) =>
  apiClient(`/course-users/course/${courseId}`);

export const createCourseUser = ({ courseId, userId, courseRole }) =>
  apiClient('/course-users', { method: 'POST', body: JSON.stringify({ courseId, userId, courseRole }) });

export const updateCourseUser = ({ id, courseRole }) =>
  apiClient('/course-users', { method: 'PUT', body: JSON.stringify({ id, courseRole }) });

export const enrollStudentsBulk = ({ courseId, studentIds }) =>
  apiClient('/course-users/students/bulk', { method: 'POST', body: JSON.stringify({ courseId, studentIds }) });

export const deleteCourseUser = (courseUserId) =>
  apiClient(`/course-users/${courseUserId}`, { method: 'DELETE' });
