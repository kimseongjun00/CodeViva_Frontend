import { apiClient } from './client';

export const getSubmission = (submissionId) =>
  apiClient(`/submissions/${submissionId}`);

export const getSubmissionsByAssignment = (assignmentId) =>
  apiClient(`/submissions/assignment/${assignmentId}`);

export const getSubmissionAttachmentUrl = (submissionId) =>
  apiClient(`/submissions/${submissionId}/attachment-url`);

export const createSubmission = ({ assignmentId, description, attachment }) => {
  const form = new FormData();
  form.append('assignmentId', assignmentId);
  if (description) form.append('description', description);
  if (attachment) form.append('attachment', attachment);
  return apiClient('/submissions', { method: 'POST', body: form });
};

export const updateSubmission = ({ id, description, removeAttachment, attachment }) => {
  const form = new FormData();
  form.append('id', id);
  if (description != null) form.append('description', description);
  if (removeAttachment != null) form.append('removeAttachment', removeAttachment);
  if (attachment) form.append('attachment', attachment);
  return apiClient('/submissions', { method: 'PUT', body: form });
};

export const deleteSubmission = (submissionId) =>
  apiClient(`/submissions/${submissionId}`, { method: 'DELETE' });
