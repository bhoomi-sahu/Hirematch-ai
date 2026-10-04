import api from './api';

export const startBulkScreen = async (jobId, files, onProgress) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('resumes', f));
  const response = await api.post(`/jobs/${jobId}/bulk-screen`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return response.data;
};

export const getBatchStatus = async (jobId, batchId) => {
  const response = await api.get(`/jobs/${jobId}/bulk-screen/${batchId}/status`);
  return response.data;
};

export const getScreenedCandidates = async (jobId, params = {}) => {
  const response = await api.get(`/jobs/${jobId}/candidates`, { params });
  return response.data;
};

export const updateCandidateStatus = async (jobId, resumeId, status) => {
  const response = await api.patch(`/jobs/${jobId}/candidates/${resumeId}/status`, { status });
  return response.data;
};
