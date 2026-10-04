export const APP_STATUS_LABELS = {
  applied: 'Applied',
  screening: 'Shortlisted',
  interview: 'Interview',
  offered: 'Selected',
  rejected: 'Rejected',
};

export const APP_STATUS_BADGE = {
  applied: 'blue',
  screening: 'indigo',
  interview: 'amber',
  offered: 'green',
  rejected: 'rose',
};

export const APP_STATUS_ORDER = ['applied', 'screening', 'interview', 'offered', 'rejected'];

export const RESUME_STATUS_BADGE = {
  queued: 'slate',
  processing: 'amber',
  completed: 'green',
  failed: 'rose',
};

export const MATCH_CATEGORY_BADGE = {
  'Strong Match': 'green',
  'Moderate Match': 'amber',
  'Low Match': 'rose',
};

export const SCREENING_STATUS_BADGE = {
  new: 'slate',
  shortlisted: 'green',
  rejected: 'rose',
};

export const scoreColor = (score) => {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'amber';
  return 'rose';
};
