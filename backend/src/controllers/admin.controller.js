const adminService = require('../services/admin.service');
const seedService = require('../services/seed.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get Platform Statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    return res
      .status(200)
      .json(ApiResponse.success(stats, 'Platform statistics retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const users = await adminService.getAllUsers({ role, search });
    return res
      .status(200)
      .json(ApiResponse.success(users, 'User directory retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(req.params.id, req.body.role);
    return res
      .status(200)
      .json(ApiResponse.success(user, 'User role updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend a user account
 * @route   PATCH /api/admin/users/:id/suspend
 * @access  Private (Admin)
 */
const suspendUser = async (req, res, next) => {
  try {
    const user = await adminService.setUserActive(req.params.id, false);
    return res.status(200).json(ApiResponse.success(user, 'User suspended successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate a user account
 * @route   PATCH /api/admin/users/:id/activate
 * @access  Private (Admin)
 */
const activateUser = async (req, res, next) => {
  try {
    const user = await adminService.setUserActive(req.params.id, true);
    return res.status(200).json(ApiResponse.success(user, 'User reactivated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications platform-wide
 * @route   GET /api/admin/applications
 * @access  Private (Admin)
 */
const getAllApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const applications = await adminService.getAllApplications({ status, search });
    return res
      .status(200)
      .json(ApiResponse.success(applications, 'Platform applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    return res
      .status(200)
      .json(ApiResponse.success(result, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs across platform
 * @route   GET /api/admin/jobs
 * @access  Private (Admin)
 */
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await adminService.getAllJobs();
    return res
      .status(200)
      .json(ApiResponse.success(jobs, 'All platform jobs retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed demo data
 * @route   POST /api/admin/seed
 * @access  Public / Admin
 */
const seedData = async (req, res, next) => {
  try {
    const result = await seedService.seedDemoData();
    return res
      .status(200)
      .json(ApiResponse.success(result, 'Demo data seeded successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  suspendUser,
  activateUser,
  getAllApplications,
  deleteUser,
  getAllJobs,
  seedData,
};
