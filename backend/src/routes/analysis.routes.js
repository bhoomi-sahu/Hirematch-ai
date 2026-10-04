const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// POST and GET behave identically here: compute-or-return-cached. Both are exposed
// so the frontend can use POST to explicitly (re)trigger and GET to passively check.
router.post('/job/:jobId/resume/:resumeId', analysisController.getAnalysis);
router.get('/job/:jobId/resume/:resumeId', analysisController.getAnalysis);

module.exports = router;
