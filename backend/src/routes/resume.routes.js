const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadSingleResume } = require('../middleware/upload.middleware');

router.use(protect);

router.post('/upload', authorize('candidate'), uploadSingleResume, resumeController.uploadResume);
router.get('/', authorize('candidate'), resumeController.listResumes);
router.get('/:id', resumeController.getResume);
router.get('/:id/file', resumeController.getResumeFile);
router.post('/:id/reprocess', authorize('candidate'), resumeController.reprocessResume);
router.delete('/:id', authorize('candidate'), resumeController.deleteResume);

module.exports = router;
