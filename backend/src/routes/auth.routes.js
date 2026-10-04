const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const { protect, authorize } = require('../middleware/auth.middleware');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * Public Authentication Routes
 */
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

/**
 * Protected User Profile Route
 */
router.get('/me', protect, getMe);

/**
 * Role-Based Authorization Verification Routes
 */
router.get('/candidate-only', protect, authorize('candidate'), (req, res) => {
  res.json(ApiResponse.success({ role: req.user.role }, 'Access granted to candidate resource'));
});

router.get('/recruiter-only', protect, authorize('recruiter'), (req, res) => {
  res.json(ApiResponse.success({ role: req.user.role }, 'Access granted to recruiter resource'));
});

router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json(ApiResponse.success({ role: req.user.role }, 'Access granted to admin resource'));
});

module.exports = router;
