const express = require('express');
const router = express.Router();
const controller = require('../controllers/resumeImprove.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('candidate'));

router.post('/:resumeId/improve/:jobId', controller.generate);
router.get('/:resumeId/improvements', controller.history);

module.exports = router;
