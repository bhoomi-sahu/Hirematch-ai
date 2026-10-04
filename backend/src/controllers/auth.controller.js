const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName, adminAccessCode } = req.body;
    const result = await authService.registerUser({
      name,
      email,
      password,
      role,
      companyName,
      adminAccessCode,
    });
    return res
      .status(201)
      .json(ApiResponse.created(result, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return res
      .status(200)
      .json(ApiResponse.success(result, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user.toJSON();
    return res
      .status(200)
      .json(ApiResponse.success(user, 'Current user profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
