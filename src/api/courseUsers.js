import { apiClient } from './client';

export const createCourseUser = ({ courseId, userId, courseRole }) =>
  apiClient('/course-users', { method: 'POST', body: JSON.stringify({ courseId, userId, courseRole }) });

export const updateCourseUser = ({ id, courseRole }) =>
  apiClient('/course-users', { method: 'PUT', body: JSON.stringify({ id, courseRole }) });

export const deleteCourseUser = (courseUserId) =>
  apiClient(`/course-users/${courseUserId}`, { method: 'DELETE' });
