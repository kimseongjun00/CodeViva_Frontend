import { apiClient } from './client';

export const createAnnouncementComment = ({ announcementId, content }) =>
  apiClient('/announcement-comments', { method: 'POST', body: JSON.stringify({ announcementId, content }) });

export const updateAnnouncementComment = ({ id, content }) =>
  apiClient('/announcement-comments', { method: 'PUT', body: JSON.stringify({ id, content }) });

export const deleteAnnouncementComment = (announcementCommentId) =>
  apiClient(`/announcement-comments/${announcementCommentId}`, { method: 'DELETE' });
