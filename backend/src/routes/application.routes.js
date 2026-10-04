const express = require('express');
const {
  applyToJob,
  getCandidateApplications,
  getJobApplications,
  getRecruiterApplications,
  updateStatus,
  addNote,
} = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Candidate endpoints
router.post('/', protect, authorize('candidate'), applyToJob);
router.get('/candidate', protect, authorize('candidate'), getCandidateApplications);

// Recruiter endpoints
router.get('/recruiter', protect, authorize('recruiter', 'admin'), getRecruiterApplications);
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), getJobApplications);
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), updateStatus);
router.post('/:id/notes', protect, authorize('recruiter', 'admin'), addNote);

module.exports = router;
