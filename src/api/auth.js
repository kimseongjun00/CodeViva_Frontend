import { apiClient } from './client';

export const login = ({ email, password }) =>
  apiClient('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = ({ name, email, password }) =>
  apiClient('/users/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const getMe = () => apiClient('/users/me');

export const getAllUsers = () => apiClient('/users/all');
