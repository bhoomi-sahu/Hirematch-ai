import api from './api';

export const uploadResume = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return response.data;
};

export const getMyResumes = async () => {
  const response = await api.get('/resumes');
  return response.data;
};

export const getResumeById = async (resumeId) => {
  const response = await api.get(`/resumes/${resumeId}`);
  return response.data;
};

export const getResumeFileUrl = (resumeId) => {
  const base = api.defaults.baseURL;
  return `${base}/resumes/${resumeId}/file`;
};

export const reprocessResume = async (resumeId) => {
  const response = await api.post(`/resumes/${resumeId}/reprocess`);
  return response.data;
};

export const deleteResume = async (resumeId) => {
  const response = await api.delete(`/resumes/${resumeId}`);
  return response.data;
};
