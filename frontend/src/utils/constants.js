export const APP_NAME = 'HireMatch AI';
export const APP_TAGLINE = 'AI-Powered Recruitment & Resume Intelligence Platform';

export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
  ADMIN: 'admin',
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
