import { apiClient } from './client';

export const createAnnouncement = ({ courseId, title, content }) =>
  apiClient('/announcements', { method: 'POST', body: JSON.stringify({ courseId, title, content }) });

export const updateAnnouncement = ({ id, title, content }) =>
  apiClient('/announcements', { method: 'PUT', body: JSON.stringify({ id, title, content }) });

export const deleteAnnouncement = (announcementId) =>
  apiClient(`/announcements/${announcementId}`, { method: 'DELETE' });
