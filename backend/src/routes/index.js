const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');
const profileRoutes = require('./profile.routes');
const adminRoutes = require('./admin.routes');
const resumeRoutes = require('./resume.routes');
const analysisRoutes = require('./analysis.routes');
const bulkScreenRoutes = require('./bulkScreen.routes');
const resumeImproveRoutes = require('./resumeImprove.routes');
const aiRoutes = require('./ai.routes');

const router = express.Router();

// Mount all active sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/jobs', bulkScreenRoutes); // adds /jobs/:jobId/bulk-screen and /jobs/:jobId/candidates
router.use('/applications', applicationRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resumes', resumeImproveRoutes); // adds /resumes/:resumeId/improve/:jobId
router.use('/analysis', analysisRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
