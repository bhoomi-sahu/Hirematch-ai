import api from './api';

export const generateImprovement = async (resumeId, jobId) => {
  const response = await api.post(`/resumes/${resumeId}/improve/${jobId}`);
  return response.data;
};

export const getImprovementHistory = async (resumeId) => {
  const response = await api.get(`/resumes/${resumeId}/improvements`);
  return response.data;
};
