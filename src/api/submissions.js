import { apiClient } from './client';

export const getSubmission = (submissionId) =>
  apiClient(`/submissions/${submissionId}`);

export const getMySubmissions = () =>
  apiClient('/submissions/my');

export const getSubmissionsByAssignment = (assignmentId) =>
  apiClient(`/submissions/assignment/${assignmentId}`);

export const createSubmission = ({ assignmentId, code }) =>
  apiClient('/submissions', {
    method: 'POST',
    body: JSON.stringify({ assignmentId, code }),
  });

export const updateSubmission = ({ id, code }) =>
  apiClient('/submissions', {
    method: 'PUT',
    body: JSON.stringify({ id, code }),
  });

export const deleteSubmission = (submissionId) =>
  apiClient(`/submissions/${submissionId}`, { method: 'DELETE' });

export const evaluateSubmission = (submissionId) =>
  apiClient(`/submissions/${submissionId}/evaluate`, { method: 'POST' });
