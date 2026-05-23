import { apiClient } from './client';

export const getCourses = () =>
  apiClient('/courses');

export const getCourse = (courseId) =>
  apiClient(`/courses/${courseId}`);

export const createCourse = ({ name, year, semester }) =>
  apiClient('/courses', { method: 'POST', body: JSON.stringify({ name, year, semester }) });

export const updateCourse = ({ id, name, year, semester }) =>
  apiClient('/courses', { method: 'PUT', body: JSON.stringify({ id, name, year, semester }) });

export const deleteCourse = (courseId) =>
  apiClient(`/courses/${courseId}`, { method: 'DELETE' });
