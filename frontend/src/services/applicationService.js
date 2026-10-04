import api from './api';

export const applyToJob = async (jobId, coverLetter = '', resumeId = null) => {
  const response = await api.post('/applications', { jobId, coverLetter, resumeId });
  return response.data;
};

export const getCandidateApplications = async () => {
  const response = await api.get('/applications/candidate');
  return response.data;
};

export const getRecruiterApplications = async () => {
  const response = await api.get('/applications/recruiter');
  return response.data;
};

export const getJobApplications = async (jobId) => {
  const response = await api.get(`/applications/job/${jobId}`);
  return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await api.patch(`/applications/${applicationId}/status`, { status });
  return response.data;
};

export const addApplicationNote = async (applicationId, text) => {
  const response = await api.post(`/applications/${applicationId}/notes`, { text });
  return response.data;
};
