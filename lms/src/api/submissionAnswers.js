import { apiClient } from './client';

export const saveBatchAnswers = ({ submissionId, questionIds, audioFiles }) => {
  const form = new FormData();
  form.append('submissionId', submissionId);
  questionIds.forEach((id) => form.append('questionIds', id));
  audioFiles.forEach((file, index) => form.append('audioFiles', file, `answer_${index}.webm`));
  return apiClient('/submission-answers/batch', { method: 'POST', body: form });
};

export const getAnswer = (answerId) =>
  apiClient(`/submission-answers/${answerId}`);

export const getAnswersBySubmission = (submissionId) =>
  apiClient(`/submission-answers/submission/${submissionId}`);

export const deleteAnswer = (answerId) =>
  apiClient(`/submission-answers/${answerId}`, { method: 'DELETE' });
