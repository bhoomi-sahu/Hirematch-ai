import api from './api';

export const analyzeJobWithAI = async (title, description, responsibilities) => {
  const response = await api.post('/ai/parse-job', { title, description, responsibilities });
  return response.data;
};
