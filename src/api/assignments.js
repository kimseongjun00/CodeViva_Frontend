import { apiClient } from './client';

export const getAssignment = (assignmentId) =>
  apiClient(`/assignments/${assignmentId}`);

export const getAssignmentsByCourse = (courseId) =>
  apiClient(`/assignments/course/${courseId}`);

export const getAssignmentAttachmentUrl = (assignmentId) =>
  apiClient(`/assignments/${assignmentId}/attachment-url`);

export const createAssignment = ({ courseId, title, openAt, dueAt, score, description, attachment }) => {
  const form = new FormData();
  form.append('courseId', courseId);
  if (title) form.append('title', title);
  if (openAt) form.append('openAt', openAt);
  if (dueAt) form.append('dueAt', dueAt);
  if (score != null) form.append('score', score);
  if (description) form.append('description', description);
  if (attachment) form.append('attachment', attachment);
  return apiClient('/assignments', { method: 'POST', body: form });
};

export const updateAssignment = ({ id, title, openAt, dueAt, score, description, removeAttachment, attachment }) => {
  const form = new FormData();
  form.append('id', id);
  if (title != null) form.append('title', title);
  if (openAt != null) form.append('openAt', openAt);
  if (dueAt != null) form.append('dueAt', dueAt);
  if (score != null) form.append('score', score);
  if (description != null) form.append('description', description);
  if (removeAttachment != null) form.append('removeAttachment', removeAttachment);
  if (attachment) form.append('attachment', attachment);
  return apiClient('/assignments', { method: 'PUT', body: form });
};

export const deleteAssignment = (assignmentId) =>
  apiClient(`/assignments/${assignmentId}`, { method: 'DELETE' });
