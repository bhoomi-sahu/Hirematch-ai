const express = require('express');
const {
  createJob,
  getJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
  deleteJob,
} = require('../controllers/job.controller');
const { protect, optionalProtect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / Candidate browse
router.get('/', optionalProtect, getJobs);
router.get('/recruiter/my', protect, authorize('recruiter', 'admin'), getRecruiterJobs);
router.get('/:id', optionalProtect, getJobById);

// Recruiter actions
router.post('/', protect, authorize('recruiter', 'admin'), createJob);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

module.exports = router;
