const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/parse-job', protect, authorize('recruiter', 'admin'), aiController.parseJob);

module.exports = router;
