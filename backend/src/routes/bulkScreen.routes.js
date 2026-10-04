const express = require('express');
const router = express.Router();
const bulkScreenController = require('../controllers/bulkScreen.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadManyResumes } = require('../middleware/upload.middleware');

router.use(protect, authorize('recruiter', 'admin'));

router.post('/:jobId/bulk-screen', uploadManyResumes, bulkScreenController.startBatch);
router.get('/:jobId/bulk-screen/:batchId/status', bulkScreenController.getBatchStatus);
router.get('/:jobId/candidates', bulkScreenController.getCandidates);
router.patch('/:jobId/candidates/:resumeId/status', bulkScreenController.updateStatus);

module.exports = router;
