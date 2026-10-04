import api from './api';

export const getMatchAnalysis = async (jobId, resumeId) => {
  const response = await api.post(`/analysis/job/${jobId}/resume/${resumeId}`);
  return response.data;
};
