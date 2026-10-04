import api from './api';

export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const suspendUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/suspend`);
  return response.data;
};

export const activateUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/activate`);
  return response.data;
};

export const getAllApplicationsAdmin = async (params = {}) => {
  const response = await api.get('/admin/applications', { params });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAllJobs = async () => {
  const response = await api.get('/admin/jobs');
  return response.data;
};

export const seedDemoData = async () => {
  const response = await api.post('/admin/seed');
  return response.data;
};
