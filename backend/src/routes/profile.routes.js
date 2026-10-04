const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  analyzeResume,
} = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.post('/analyze-resume', protect, analyzeResume);

module.exports = router;
