const express = require('express');
const {
  getStats,
  getUsers,
  updateUserRole,
  suspendUser,
  activateUser,
  getAllApplications,
  deleteUser,
  getAllJobs,
  seedData,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Platform seed route (convenient for setup and testing)
router.post('/seed', seedData);

// Admin protected routes
router.get('/stats', protect, authorize('admin'), getStats);
router.get('/users', protect, authorize('admin'), getUsers);
router.patch('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.patch('/users/:id/suspend', protect, authorize('admin'), suspendUser);
router.patch('/users/:id/activate', protect, authorize('admin'), activateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/jobs', protect, authorize('admin'), getAllJobs);
router.get('/applications', protect, authorize('admin'), getAllApplications);

module.exports = router;
