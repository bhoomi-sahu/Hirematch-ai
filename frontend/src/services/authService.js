import api from './api';

export const registerUser = async ({ name, email, password, role, companyName, adminAccessCode }) => {
  const payload = {
    name,
    email,
    password,
    role,
  };

  if (role === 'recruiter' && companyName) {
    payload.companyName = companyName;
  }

  if (role === 'admin' && adminAccessCode) {
    payload.adminAccessCode = adminAccessCode;
  }

  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
